// @ts-nocheck
const fs = jest.createMockFromModule("fs");
fs.existsSync = jest.fn();
fs.writeFileSync = jest.fn();
fs.appendFileSync = jest.fn((path, data, encoding) => {
  if (typeof encoding === "undefined") {
    arguments[2] = "utf-8";
  }
});
fs.readFileSync = jest.fn();
module.exports = fs;
