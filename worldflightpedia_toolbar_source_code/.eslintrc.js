// ESLint configuration to ignore SimVar, SetStoredData, and related globals for worldflightpedia_toolbar project
module.exports = {
  globals: {
    SimVar: "readonly",
    SetStoredData: "readonly",
    GetStoredData: "readonly",
    Coherent: "readonly",
    call: "readonly",
    engine: "readonly",
    trigger: "readonly",
  },
};
