// Algolia search settings (https://www.algolia.com, free Build plan).
//
// Leave appId empty to use the built-in on-device search instead.
// Use the SEARCH-ONLY API key here (never the Admin key): it can only read the index.
//
// The indexes are filled automatically by the Firebase extension
// "Search Firestore with Algolia" (one install per collection):
//   users    -> index "ngos"      fields: organisationName, mission, location, targetCommunity, role
//   projects -> index "projects"  fields: title, description, cause, location, orgName
export const ALGOLIA = {
    appId: "",
    searchKey: "",
    ngoIndex: "ngos",
    projectIndex: "projects",
};
