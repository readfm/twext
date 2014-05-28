// firebase refs
var baseRef = "https://readfm.firebaseio.com/"; // base firebase ref
// firebase tables
var refs = {
  accessToken: baseRef+"AccessToken/",       // access token
  syllableLookup: baseRef+"syllableLookup/", // sybs lookup table
  // Main db
  mapping: baseRef+"urlMapping/",  // url-text mapping table
  data: baseRef+"data/",           // text data table
  history: baseRef+"dataHistory/", // history table (urls list)
  // test db
  test: {
    mapping: baseRef+"test/urlMapping/",  // url-text mapping table
    data: baseRef+"test/data/",           // text data table
    history: baseRef+"test/dataHistory/", // history table (urls list)
  }
};