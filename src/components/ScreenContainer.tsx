import { View } from "react-native";

import { COLORS } from "../constants/colors";

type Props = {
  children: React.ReactNode;
};

export default function ScreenContainer({
  children,
}: Props) {
  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.background,
      }}
    >
      {children}
    </View>
  );
}