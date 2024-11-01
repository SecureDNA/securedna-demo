const fs = require('node:fs/promises');
const path = require ('node:path');


let influenzaLargestCounter = 0;
let influenzaCounted = [];

/** A request to the /v1/screen endpoint. */
interface ApiRequest {
  /**
  * The input FASTA. This field MUST be included.
  */
  fasta: string,
  /**
  * The screening region. This field MUST be included.
  * See below for more details.
  */
  region: "us" | "prc" | "eu" | "all";
  /**
  * An optional arbitrary string that will be returned in the
  * response, for your tracking purposes. This field MAY be included.
  *
  * Note that this string may be logged in our backend, so be careful
  * about including sensitive information (such as customer names).
  */
  provider_reference?: string | null,
}


/** The top-level response. */
export interface ApiResponse {
  /** Whether synthesis should be allowed to proceed. */
  synthesis_permission: "granted" | "denied";
  /** If provided in the input, `provider_reference` will be
  * returned here. `null` otherwise.
  */

  provider_reference?: string | null;
  /**
  * If `synthesis_permission` is `"denied"` due to one or more
  * screening hits, this list will contain those hits, grouped
  * by which record they occurred in.
  */
  hits_by_record?: FastaRecordHits[];
  /** Any non-fatal warnings will be in this list. */
  warnings?: ErrorOrWarning[];
  /**
  * Will contain fatal errors if `synthesis_permission
  * is `"denied"` due to an error.
  */
  errors?: ErrorOrWarning[];
}

/** Screening hits, grouped by which record they occurred in. */
export interface FastaRecordHits {
  /** The record header, possibly empty. */
  fasta_header: string;
  /** Line range in FASTA input this record covers. */
  line_number_range: [number, number];
  /** The length of the record sequence. */
  sequence_length: number;
  /**
  * The hits that occurred in this record, grouped by similarity.
  */
  hits_by_hazard: HazardHits[];
}

/** A list of hits grouped by similarity. */
export interface HazardHits {
  /** Whether this hit group matched nucleotides or amino acids. */
  type: "nuc" | "aa";
  /**
  * Whether this hit group matched a hazard wild type
  * (observed genome) or predicted functional variant
  * (mutation SecureDNA believes would still be hazardous).
  * This field is always `null` for `type: "nuc"` hit groups.
  */
  is_wild_type: boolean | null;
  /**
  * A list of regions in the sequence that matched this
  * hazard group.
  */


  hit_regions: HitRegion[];
  /** The most likely organism match for this hazard group. */
  most_likely_organism: Organism;
  /**
  * All possible hazard matches for this hazard group,
  * including `most_likely_organism`.
  */
  organisms: Organism[];
}
/** A region of a record sequence that matched one or more hazards. */
export interface HitRegion {
  /** The matching subsequence. */
  seq: string;
  /** The start of `seq` in the record sequence, in bp. */
  seq_range_start: number;
  /** The (exclusive) end of `seq` in the record sequence, in bp. */
  seq_range_end: number;
}
/** Organism metadata. */
export interface Organism {
  /** The SecureDNA name for this organism. */
  name: string;
  /** The high-level classification of this organism. */
  organism_type: "Virus" | "Toxin" | "Bacterium" | "Fungus";
  /** A list of NCBI accession numbers for this organism. */
  ans: string[];
  /**
  * A list of SecureDNA tags for this organism.
  * A table of current tags is included below,
  * but more may be added in the future.
  */
  tags: string[];
}
/** An error or warning. */
export type ErrorOrWarning = {
  /**
  * The diagnostic code.
  * A list of current diagnostic codes is provided
  * below, but more may be added in the future.
  */
  diagnostic: string;
  /** Additional information about the cause of this error. */
  additional_info: string;
  /**
  * If applicable, a line number range in the
  * * input FASTA that caused this error or warning.
  */
  line_number_range?: [number, number] | null;
}

async function screen(name, fasta) {

  let response;

  const request: ApiRequest = {
    fasta: fasta,
    region: 'all',
    provider_reference: 'test'
  };
  response = await fetch('http://localhost:80/v1/screen', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  }).then(res => res.json());

  const json = response as ApiResponse;

  const hitsByOrganism: { [organism: string]: HitRegion[] } = {};

  if (json.hits_by_record) {
    json.hits_by_record.forEach(record => {
      record.hits_by_hazard.forEach(hazard => {
        const organismName = hazard.most_likely_organism.name;
        if (!hitsByOrganism[organismName]) {
          hitsByOrganism[organismName] = [];
        }
        hitsByOrganism[organismName].push(...hazard.hit_regions);
      });
    });
  }

  // =================
  // join hit regions
  // =================
  const joinedHitsByOrganism: { [organism: string]: HitRegion[] } = {};

  for(const organism in hitsByOrganism) {
    const sortedHitRegions = hitsByOrganism[organism].flat().sort((a, b) => a.seq_range_start - b.seq_range_start);

    // Join overlapping hit regions
    const mergedHitRegions: HitRegion[] = [];
    let currentHitRegion: HitRegion | undefined = undefined;

    for (const hitRegion of sortedHitRegions) {
      if (!currentHitRegion) {
        currentHitRegion = hitRegion;
      } else if (hitRegion.seq_range_start <= currentHitRegion.seq_range_end) {
        currentHitRegion.seq_range_end = Math.max(currentHitRegion.seq_range_end, hitRegion.seq_range_end);
      } else {
        mergedHitRegions.push(currentHitRegion);
        currentHitRegion = hitRegion;
      }
    }

    if (currentHitRegion) {
      mergedHitRegions.push(currentHitRegion);
    }

    joinedHitsByOrganism[organism] = mergedHitRegions;

  }

  // Calculate the length of FASTA sequence
  const fastaWithoutFirstLine = fasta.substring(fasta.indexOf('\n') + 1);
  const fastaWithoutWhitespace = fastaWithoutFirstLine.replace(/\s/g, '');
  const totalSequenceLength = fastaWithoutWhitespace.length;
  
  // =================
  // Find unique indices per organism
  // =================

  const uniqueIndicesByOrganism: { [organism: string]: number[] } = {};

  for (let i = 0; i < totalSequenceLength; i++) {
    let uniqueOrganism: string | undefined = undefined;

    for (const organism in joinedHitsByOrganism) {
      const hitRegions = joinedHitsByOrganism[organism];
      let isUnique = true;

      for (const hitRegion of hitRegions) {
        if (i >= hitRegion.seq_range_start && i < hitRegion.seq_range_end) {
          if (uniqueOrganism && uniqueOrganism !== organism) {
            isUnique = false;
            break;
          }
          uniqueOrganism = organism;
        }
      }

      if (!isUnique) {
        uniqueOrganism = undefined;
        break;
      }
    }

    if (uniqueOrganism) {
      if (!uniqueIndicesByOrganism[uniqueOrganism]) {
        uniqueIndicesByOrganism[uniqueOrganism] = [];
      }
      uniqueIndicesByOrganism[uniqueOrganism].push(i);
    }
  }

  // =================
  // join unique overlapping indices into segments
  // =================
  
  const joinedUniqueIndicesByOrganism: { [organism: string]: { start: number, end: number }[] } = {};

  for (const organism in uniqueIndicesByOrganism) {
    const indices = uniqueIndicesByOrganism[organism];
    const joinedIndices: { start: number, end: number }[] = [];

    let currentStart = indices[0];
    let currentEnd = indices[0];

    for (let i = 1; i < indices.length; i++) {
      if (indices[i] === currentEnd + 1) {
        currentEnd = indices[i];
      } else {
        joinedIndices.push({ start: currentStart, end: currentEnd + 1 });
        currentStart = indices[i];
        currentEnd = indices[i];
      }
    }

    joinedIndices.push({ start: currentStart, end: currentEnd + 1 });

    joinedUniqueIndicesByOrganism[organism] = joinedIndices;
  }
  


  // =================
  // Calculate the percentage of the sequence that is a hit
  // =================
  const sortedOrganisms: { organism: string; percentageHit: number, longestHitregion: number, longestUniqueHitRegion: number }[] = [];
  for (const organism in joinedHitsByOrganism) {
      let longestHitregion = 0;
      const hitRegions = joinedHitsByOrganism[organism];
      let totalHitLength = 0;
  
      for (const hitRegion of hitRegions) {
          const hitLength = hitRegion.seq_range_end - hitRegion.seq_range_start;
          if(hitLength > longestHitregion) {
            longestHitregion = hitLength;
          }
          totalHitLength += hitLength;
      }
  
      const percentageHit = (totalHitLength / totalSequenceLength) * 100;
  
      sortedOrganisms.push({ organism, percentageHit, longestHitregion, longestUniqueHitRegion: 0 });
  }
  
  sortedOrganisms.sort((a, b) => b.longestHitregion - a.longestHitregion);


  // =================
  // Calculate the longest unique subsequence sequence that is unique
  // =================
  for (const organism in joinedUniqueIndicesByOrganism) {
    const uniqueIndices = joinedUniqueIndicesByOrganism[organism];
    let longestUniqueHitRegion = 0;

    for (const indices of uniqueIndices) {
      const uniqueHitLength = indices.end - indices.start;
      if (uniqueHitLength > longestUniqueHitRegion) {
        longestUniqueHitRegion = uniqueHitLength;
      }
    }

    sortedOrganisms.find(item => item.organism === organism).longestUniqueHitRegion = longestUniqueHitRegion;
  }

  console.log(sortedOrganisms);

}


async function processFastaFiles() {
  try {
    const fastaDirectory = './fasta';
    const files = await fs.readdir(fastaDirectory);

    let i = 0;
    for (const file of files) {
      if(file.startsWith('.')) {
        continue
      }
      const filePath = path.join(fastaDirectory, file);
      const content = await fs.readFile(filePath, 'utf8');

      console.log("=== Processing file: ", file);
      await screen(file, content)
    }
  } catch (error) {
    console.error('Error processing FASTA files:', error);
  }

}

processFastaFiles();
