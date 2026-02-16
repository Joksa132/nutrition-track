import { useState } from "react";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

export function useDatePicker(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  );

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(selectedDate),
      onChange: (_e, date) => {
        if (date) {
          const convertedDate = date.toISOString().split("T")[0];
          setSelectedDate(convertedDate);
        }
      },
      mode: "date",
      is24Hour: true,
    });
  };

  return { selectedDate, setSelectedDate, showDatepicker };
}
