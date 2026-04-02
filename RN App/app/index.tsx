import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import Btn from "../components/Btn";

const Index = () => {
  return (
    <>
      {/* StatusBar sobre a imagem em ambos os SOs */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ImageBackground
        source={require("../assets/images/rockBand02.png")}
        resizeMode="cover"
        style={styles.image}
      >
        <SafeAreaProvider>
          {/* ⬇️  NO ANDROID só aplica safe-area no topo;
               no iOS mantém todas as bordas */}
          <SafeAreaView
            style={styles.container}
            edges={Platform.OS === "android" ? ["top"] : ["top", "bottom"]}
          >
            <View style={styles.innerContainerTop}>
              <Text style={styles.title}>LIVE N LOUD</Text>
            </View>

            <View style={styles.innerContainer}>
              <Btn title="ENTER" goTo="/(login)/Login" />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </ImageBackground>
    </>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // cobre 100 % da tela (inclui status/navigation bar)
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  innerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  innerContainerTop: {
    flex: 1,
    alignItems: "center",
    marginTop: 50,
  },
  title: {
    color: "white",
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowRadius: 10,
    marginBottom: 16,
  },
});
