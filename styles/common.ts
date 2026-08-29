import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  macroGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
  },
  macroCell: {
    width: "33.33%",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  macroCellLabel: {
    fontSize: 11,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 1,
  },
  macroCellValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "black",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
