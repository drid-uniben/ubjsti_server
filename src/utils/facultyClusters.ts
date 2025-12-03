import { scienceFaculties, facultySubClusters, ClusterName } from './facultyContent';

/**
 * Returns the raw faculty and department data for UI purposes.
 * This remains unchanged to support the admin UI.
 */
export const getFacultyDepartmentData = () => {
  return scienceFaculties;
};

/**
 * Gets the name of the cluster a given faculty belongs to.
 * @param faculty - The name of the faculty.
 * @returns The name of the subcluster, or null if not found.
 */
export const getClusterByFaculty = (faculty: string): ClusterName | null => {
  for (const cluster in facultySubClusters) {
    const clusterName = cluster as ClusterName;
    if (facultySubClusters[clusterName].includes(faculty)) {
      return clusterName;
    }
  }
  return null;
};

/**
 * Gets all faculties within a specific subcluster.
 * @param cluster - The name of the subcluster.
 * @returns An array of faculty names.
 */
export const getFacultiesInCluster = (cluster: ClusterName): string[] => {
  return facultySubClusters[cluster] || [];
};

/**
 * Get eligible faculties for AUTOMATIC reviewer assignment.
 * For automatic assignment, eligible reviewers are those in the same cluster
 * as the submitter, but not in the same faculty.
 * @param submitterFaculty - The canonical faculty name of the manuscript submitter.
 * @returns Array of faculty names that can be automatically assigned.
 */
export function getEligibleFacultiesForAutomaticAssignment(submitterFaculty: string): string[] {
  const cluster = getClusterByFaculty(submitterFaculty);
  if (!cluster) {
    return [];
  }
  const facultiesInCluster = getFacultiesInCluster(cluster);
  return facultiesInCluster.filter((faculty) => faculty !== submitterFaculty);
}

/**
 * Gets eligible faculties categorized by "firstChoice" (same cluster) and
 * "secondChoice" (all other clusters) for MANUAL reviewer assignment.
 * @param submitterFaculty - The canonical faculty name of the manuscript submitter.
 * @returns An object with firstChoice and secondChoice faculty arrays.
 */
export const getFacultiesByChoice = (submitterFaculty: string) => {
  const submitterCluster = getClusterByFaculty(submitterFaculty);
  const allFaculties = Object.keys(scienceFaculties);

  if (!submitterCluster) {
    // If the submitter's faculty isn't in a cluster, all faculties are second choice
    return {
      firstChoice: [],
      secondChoice: allFaculties.filter(
        (faculty) => faculty !== submitterFaculty
      ),
    };
  }

  const firstChoice = getFacultiesInCluster(submitterCluster).filter(
    (faculty) => faculty !== submitterFaculty
  );

  const secondChoice = allFaculties.filter(
    (faculty) =>
      !facultySubClusters[submitterCluster].includes(faculty) &&
      faculty !== submitterFaculty
  );

  return { firstChoice, secondChoice };
};


/**
 * Validate if a faculty exists.
 * @param faculty - Faculty name to validate.
 * @returns True if faculty exists.
 */
export function isFacultyInCluster(faculty: string): boolean {
    const allFaculties = Object.keys(scienceFaculties);
    return allFaculties.includes(faculty);
}
