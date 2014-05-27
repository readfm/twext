// firebase refs
var baseRef = "https://readfm.firebaseio.com/"; // base firebase ref
// firebase tables
var refs = {
  accessToken: baseRef+"AccessToken/",       // access token
  // Main db
  syllableLookup: baseRef+"test/syllableLookup/", // sybs lookup table
  mapping: baseRef+"test/urlMapping/",  // url-text mapping table
  data: baseRef+"test/data/",           // text data table
  history: baseRef+"test/dataHistory/", // history table (urls list)
};