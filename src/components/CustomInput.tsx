import { TextInput } from "react-native";

type Props = {
  placeholder: string;
  value: string;
  secureTextEntry?: boolean;
  onChangeText: (text: string) => void;
  keyboardType?: any;
};

export default function CustomInput({
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
}: Props) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      style={{
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
      }}
    />
  );
}