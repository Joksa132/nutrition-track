import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 4,
    height: 40,
    justifyContent: "center" as const,
  },
  button: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center" as const,
  },
  buttonDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    padding: 15,
    alignItems: "center" as const,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold" as const,
  },
  dateButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    padding: 10,
    alignItems: "center" as const,
  },
  dateButtonText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold" as const,
  },
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
