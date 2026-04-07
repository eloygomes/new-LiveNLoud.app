import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

// type Props = {
//   title: string;
//   goTo: any;
// };

// export default function BtnNeuro({ title, goTo }: Props) {
//   const router = useRouter();

//   return (
//     <TouchableOpacity onPress={() => router.push(goTo)}>
//       <View style={styles.btn}>
//         <Text style={styles.title}>{title}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// }

type Props = {
  title: string;
  goTo?: string;
  onPress?: () => void;
};

export default function BtnNeuro({ title, goTo, onPress }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (goTo) {
      router.push(goTo as any);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.btn}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 8,
    borderRadius: 8,
    margin: 16,
    backgroundColor: "#e0e0e0",
  },
  title: {
    fontSize: 12,
    color: "black",
    paddingHorizontal: 50,
    paddingVertical: 2,
    fontWeight: "bold",
    textAlign: "center",
  },
});
