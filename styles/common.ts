import { StyleSheet } from "react-native";
import { colors, radius, shadow, space, type } from "./theme";

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.xxxl,
    flexGrow: 1,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
    ...shadow.card,
  },

  sectionTitle: {
    ...type.h2,
    marginBottom: space.md,
  },
  fieldLabel: {
    ...type.label,
    marginBottom: space.xs,
  },
  emptyText: {
    ...type.caption,
    textAlign: "center",
    paddingVertical: space.xl,
  },
  errorText: {
    ...type.body,
    color: colors.accent,
    textAlign: "center",
    paddingVertical: space.xl,
  },

  input: {
    height: 46,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    color: colors.text,
    fontFamily: type.body.fontFamily,
    fontSize: 15,
  },
  pickerWrap: {
    height: 46,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    marginBottom: space.md,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    color: colors.text,
  },

  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    ...type.button,
    color: "#FFFFFF",
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: {
    ...type.button,
    color: colors.textMuted,
  },
  btnDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.overlay,
    padding: space.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    ...shadow.modal,
  },
  modalTitle: {
    ...type.h1,
    marginBottom: space.lg,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.lg,
  },

  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  macroCell: {
    width: "33.33%",
    paddingVertical: space.xs,
    paddingRight: space.sm,
  },
  macroCellLabel: {
    ...type.label,
    fontSize: 10,
    marginBottom: 1,
  },
  macroCellValue: {
    fontFamily: type.num.fontFamily,
    fontSize: 15,
    color: colors.text,
  },
});
