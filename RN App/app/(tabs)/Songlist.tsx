// import React, { useEffect, useRef, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import FLComp, { SelectPayload } from "@/components/FlatList/FlatList";
// import ActionSheetTemplate from "@/components/ActionSheet/ActionSheet";
// import { ActionSheetRef } from "react-native-actions-sheet";
// import { useNavigation } from "expo-router";
// import ActionSheetSongFilter from "@/components/ActionSheetSongFilter/ActionSheetSongFilter";

// const Songlist = () => {
//   const sheetRefTemplate = useRef<ActionSheetRef>(null); // Item específico
//   const sheetRefFilter = useRef<ActionSheetRef>(null); // Filtro
//   const navigation = useNavigation();

//   const [selected, setSelected] = useState<SelectPayload | null>(null);

//   const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);

//   // Fechar qualquer sheet ao sair da tela
//   useEffect(() => {
//     const unsubscribe = navigation.addListener("blur", () => {
//       sheetRefTemplate.current?.hide();
//       sheetRefFilter.current?.hide();
//     });
//     return unsubscribe;
//   }, [navigation]);

//   // Quando item for selecionado → abrir ActionSheetTemplate
//   const handleSelect = (payload: SelectPayload) => {
//     setSelected(payload);
//     sheetRefTemplate.current?.show();
//   };

//   // Abrir filtro ao clicar no ícone de filtro
//   const handleOpenFilter = () => {
//     sheetRefFilter.current?.show();
//   };

//   return (
//     <View style={styles.container}>
//       {/* FLComp recebe onSelect e função para abrir filtro */}
//       <FLComp
//         onSelect={handleSelect}
//         onOpenFilter={handleOpenFilter}
//         selectedSetlists={selectedSetlists}
//       />

//       {/* ActionSheet do item selecionado */}
//       <ActionSheetTemplate ref={sheetRefTemplate} selected={selected} />

//       {/* ActionSheet do filtro */}
//       <ActionSheetSongFilter
//         ref={sheetRefFilter}
//         selected={selected}
//         selectedSetlists={selectedSetlists}
//         setSelectedSetlists={setSelectedSetlists}
//       />
//     </View>
//   );
// };

// export default Songlist;

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#F0F0F0",
//     flex: 1,
//     flexDirection: "column",
//   },
// });

import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import FLComp, { SelectPayload } from "@/components/FlatList/FlatList";
import ActionSheetTemplate from "@/components/ActionSheet/ActionSheet";
import { ActionSheetRef } from "react-native-actions-sheet";
import { useNavigation } from "expo-router";
import ActionSheetSongFilter from "@/components/ActionSheetSongFilter/ActionSheetSongFilter";

// 👇 importe o tipo do handle para ter autocomplete no ref
import type { FLCompHandle } from "@/components/FlatList/FlatList";

const Songlist = () => {
  const sheetRefTemplate = useRef<ActionSheetRef>(null); // Item específico
  const sheetRefFilter = useRef<ActionSheetRef>(null); // Filtro

  // 👇 ref para chamar refetch do FLComp
  const flRef = useRef<FLCompHandle>(null);

  const navigation = useNavigation();

  const [selected, setSelected] = useState<SelectPayload | null>(null);
  const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);

  // Fechar qualquer sheet ao sair da tela
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      sheetRefTemplate.current?.hide();
      sheetRefFilter.current?.hide();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSelect = (payload: SelectPayload) => {
    setSelected(payload);
    sheetRefTemplate.current?.show();
  };

  const handleOpenFilter = () => {
    sheetRefFilter.current?.show();
  };

  // 👇 função que você pode chamar quando quiser (ex.: após salvar algo no modal)
  const forceRefresh = async () => {
    await flRef.current?.refetch();
  };

  return (
    <View style={styles.container}>
      {/* Agora passamos o ref para o FLComp */}
      <FLComp
        ref={flRef}
        onSelect={handleSelect}
        onOpenFilter={handleOpenFilter}
        selectedSetlists={selectedSetlists}
      />

      {/* ActionSheet do item selecionado */}
      <ActionSheetTemplate
        ref={sheetRefTemplate}
        selected={selected}
        // Exemplo: após alguma ação dentro do sheet, você pode chamar forceRefresh()
        // onDidSave={forceRefresh}  ← se seu componente suportar esse callback
      />

      {/* ActionSheet do filtro */}
      <ActionSheetSongFilter
        ref={sheetRefFilter}
        selected={selected}
        selectedSetlists={selectedSetlists}
        setSelectedSetlists={async (v) => {
          setSelectedSetlists(v);
          // Opcional: ao fechar/alterar o filtro, refaça o fetch
          await forceRefresh();
        }}
      />
    </View>
  );
};

export default Songlist;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F0F0",
    flex: 1,
    flexDirection: "column",
  },
});
