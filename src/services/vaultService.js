export const vaultService = {
  exportToJson(vaults) {
    return JSON.stringify(vaults, null, 2);
  },

  importFromJson(rawText) {
    const data = JSON.parse(rawText);
    if (!Array.isArray(data)) {
      throw new Error("Invalid vault format");
    }
    return data;
  }
};
