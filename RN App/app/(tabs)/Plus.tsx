// import {
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ActivityIndicator, // [NOVO] indicador de carregamento
// } from "react-native";
// import React, { useRef, useState, useCallback, useEffect } from "react";
// import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
// import ActionSheetTemplate from "@/components/ActionSheetSong/ActionSheetSong";
// import { ActionSheetRef } from "react-native-actions-sheet";
// import { SelectPayload } from "@/components/FlatList/FlatList";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// /* ──────────────── BOTÃO GENÉRICO ──────────────── */
// type TouchableBTNProps = {
//   btnName: string;
//   bgColor?: string;
//   textColor?: string;
//   status?: boolean;
//   instName?: string;
//   onSelect: (payload: SelectPayload) => void;
// };

// const TouchableBTN = ({
//   btnName,
//   bgColor = "#E0E0E0",
//   status = false,
//   textColor = "#000",
//   onSelect,
//   instName,
// }: TouchableBTNProps) => (
//   <TouchableOpacity
//     disabled={!status}
//     style={[
//       styles.btnNeumorphic,
//       { backgroundColor: bgColor, opacity: status ? 0.4 : 1 },
//     ]}
//     onPress={() => onSelect({ instrument: instName } as SelectPayload)}
//   >
//     <Text style={[styles.titleInstrument, { color: textColor }]}>
//       {btnName}
//     </Text>
//   </TouchableOpacity>
// );

// /* ──────────────── TELA PLUS ──────────────── */
// const Plus = () => {
//   const sheetRef = useRef<ActionSheetRef>(null);
//   const [selected, setSelected] = useState<SelectPayload | null>(null);

//   const [link, setLink] = useState<string>("");
//   const [dataFromUrl, setDataFromUrl] = useState<string | null>(null);

//   const [artist, setArtist] = useState<string>("Artist");
//   const [song, setSong] = useState<string>("Song");

//   // [NOVO] controla UI de carregamento e evita múltiplos submits
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   const userEmail = "teste@teste.com";

//   // ---- helpers de parsing/normalização ----
//   const safeParse = (maybeJson: unknown) => {
//     try {
//       if (typeof maybeJson === "string") return JSON.parse(maybeJson);
//       return maybeJson;
//     } catch (e) {
//       console.warn("[safeParse] falha ao fazer JSON.parse:", e);
//       return null;
//     }
//   };

//   const normalizeToArray = (obj: any): any[] => {
//     if (Array.isArray(obj)) return obj;
//     if (obj && typeof obj === "object") return Object.values(obj);
//     return [];
//   };

//   const pickLatestWithArtistSong = (arr: any[]) => {
//     return [...arr]
//       .reverse()
//       .find(
//         (it) => typeof it?.artist === "string" && typeof it?.song === "string"
//       );
//   };

//   // ---- GET consolidado: preenche artist/song a partir do retorno (mesmo com chaves numéricas) ----
//   const gettingSongData = useCallback(async () => {
//     console.log("[gettingSongData] iniciando fetch...");
//     try {
//       const url = `https://api.live.eloygomes.com/api/alldata/${userEmail}`;
//       const response = await axios.get(url);

//       console.log(
//         "[gettingSongData] status:",
//         response?.status,
//         "tipo data:",
//         typeof response?.data
//       );
//       if (response?.data && typeof response.data === "object") {
//         console.log(
//           "[gettingSongData] chaves data:",
//           Object.keys(response.data)
//         );
//       } else {
//         console.log(
//           "[gettingSongData] preview data:",
//           String(response?.data).slice(0, 160)
//         );
//       }

//       const dataStr =
//         typeof response.data === "string"
//           ? response.data
//           : JSON.stringify(response.data);
//       setDataFromUrl(dataStr);

//       const parsed = safeParse(dataStr);
//       const list = normalizeToArray(parsed);
//       console.log(
//         "[gettingSongData] normalizado p/ array? len=",
//         Array.isArray(list) ? list.length : "n/a"
//       );

//       const latest = pickLatestWithArtistSong(list);
//       if (latest) {
//         console.log(
//           "[gettingSongData] latest.artist/song:",
//           latest.artist,
//           latest.song
//         );
//         setArtist(latest.artist);
//         setSong(latest.song);
//         return true; // [NOVO] indica que preencheu
//       } else {
//         console.log(
//           "[gettingSongData] nenhum item com artist/song encontrado — mantendo placeholders."
//         );
//         return false;
//       }
//     } catch (error: any) {
//       console.error(
//         "[gettingSongData] erro:",
//         error?.message || String(error?.toString?.() ?? error)
//       );
//       return false;
//     }
//   }, [userEmail]);

//   // [NOVO] polling simples pós-scrape: tenta N vezes até achar artist/song
//   const pollArtistSong = useCallback(
//     async (attempts = 5, intervalMs = 1200) => {
//       for (let i = 1; i <= attempts; i++) {
//         console.log(`[poll] tentativa ${i}/${attempts}`);
//         const ok = await gettingSongData();
//         if (ok) return true;
//         await new Promise((r) => setTimeout(r, intervalMs));
//       }
//       return false;
//     },
//     [gettingSongData]
//   );

//   // ---- SUBMIT: tenta /generalCifra; se 404, faz /scrape; em ambos os casos preenche artist/song ----
//   const handleSubmit = useCallback(
//     async (instrumentName: string, linkValue: string) => {
//       // [NOVO] evita duplo submit e mostra loading
//       if (isLoading) {
//         console.log("[handleSubmit] ignorado — já está carregando.");
//         return;
//       }
//       setIsLoading(true);
//       setArtist("Carregando...");
//       setSong("Carregando...");

//       const email = userEmail;

//       console.log(
//         "[handleSubmit] start → instrumentName:",
//         instrumentName,
//         "link:",
//         linkValue
//       );

//       try {
//         // 1) verifica se já existe
//         try {
//           const res = await axios.post(
//             "https://api.live.eloygomes.com/api/generalCifra",
//             { instrument: instrumentName, link: linkValue }
//           );

//           console.log(
//             "[generalCifra] status:",
//             res?.status,
//             "tipo data:",
//             typeof res?.data
//           );
//           if (res?.data && typeof res.data === "object") {
//             console.log("[generalCifra] chaves data:", Object.keys(res.data));
//           }

//           const str =
//             typeof res.data === "string" ? res.data : JSON.stringify(res.data);
//           setDataFromUrl(str);

//           const parsed = safeParse(str);
//           const directArtist = parsed?.artist;
//           const directSong = parsed?.song;

//           if (
//             typeof directArtist === "string" &&
//             typeof directSong === "string"
//           ) {
//             setArtist(directArtist);
//             setSong(directSong);
//             console.log(
//               "[generalCifra] artist/song preenchidos direto do POST."
//             );
//           } else {
//             console.log(
//               "[generalCifra] sem artist/song no body → chamando GET consolidate."
//             );
//             await gettingSongData();
//           }

//           return;
//         } catch (err: any) {
//           const status = err?.response?.status;
//           console.log("[generalCifra] erro status:", status);

//           if (status !== 404) {
//             console.error("[generalCifra] erro não 404:", err?.message || err);
//             return;
//           }
//           console.log("[generalCifra] 404 → não existe. Indo para /scrape...");
//         }

//         // 2) não existe → scrape
//         const scrapeRes = await axios.post(
//           "https://api.live.eloygomes.com/api/scrape",
//           {
//             artist: "",
//             song: "",
//             email,
//             instrument: instrumentName,
//             instrument_progressbar: 0,
//             link: linkValue,
//           }
//         );

//         console.log(
//           "[scrape] status:",
//           scrapeRes?.status,
//           "tipo data:",
//           typeof scrapeRes?.data
//         );
//         if (scrapeRes?.data && typeof scrapeRes.data === "object") {
//           console.log("[scrape] chaves data:", Object.keys(scrapeRes.data));
//         }

//         await AsyncStorage.setItem("fromWHERE", "URL");

//         // [NOVO] polling: tenta achar artist/song já na primeira vez
//         const ok = await pollArtistSong(6, 1200); // ~7s total
//         if (!ok) {
//           console.warn("[poll] não encontrou artist/song dentro do tempo.");
//           // fallback leve: tenta pelo menos 1 GET final
//           await gettingSongData();
//         } else {
//           console.log("[poll] artist/song preenchidos com sucesso.");
//         }
//       } finally {
//         // [NOVO] encerra loading (com pequeno delay pra UX)
//         setTimeout(() => setIsLoading(false), 150);
//       }
//     },
//     [gettingSongData, pollArtistSong, userEmail, isLoading]
//   );

//   // ---- abre o sheet com instrumento selecionado ----
//   const handleSelect = (payload: SelectPayload) => {
//     console.log("[handleSelect] instrumento selecionado:", payload?.instrument);
//     setSelected(payload);
//     sheetRef.current?.show();
//   };

//   // ---- carrega dados iniciais ----
//   useEffect(() => {
//     gettingSongData();
//   }, [gettingSongData]);

//   return (
//     <>
//       <ActionSheetTemplate
//         ref={sheetRef}
//         selected={selected}
//         onSubmit={handleSubmit}
//         link={link}
//         setLink={setLink}
//       />
//       <StatusBar barStyle="dark-content" backgroundColor="transparent" />
//       <SafeAreaProvider>
//         <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
//           <View style={styles.container}>
//             {/* título */}
//             <View style={styles.neumorphic}>
//               <Text style={styles.title}>Add new song</Text>
//             </View>

//             {/* cabeçalho de campos */}
//             <View style={styles.neumorphic}>
//               {/* [NOVO] mostra loading visual junto do texto */}
//               <View
//                 style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
//               >
//                 {isLoading && <ActivityIndicator size="small" />}
//                 <Text style={styles.titleFormat}>{artist}</Text>
//               </View>
//               <View
//                 style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
//               >
//                 {isLoading && <ActivityIndicator size="small" />}
//                 <Text style={styles.titleFormat}>{song}</Text>
//               </View>

//               <View style={styles.row}>
//                 <Text style={styles.pick}>CAPO</Text>
//                 <Text style={styles.pick}>TOM</Text>
//                 <Text style={styles.pick}>TUNER</Text>
//               </View>
//             </View>

//             {/* botões de instrumentos */}
//             <ScrollView style={styles.wrapper}>
//               <View style={styles.neumorphicMain}>
//                 <View style={styles.row}>
//                   <TouchableBTN
//                     btnName="Guitar 01"
//                     onSelect={handleSelect}
//                     instName="guitar01"
//                     status={!isLoading} // [NOVO] opcional: desativa enquanto carrega
//                   />
//                   <TouchableBTN
//                     btnName="Guitar 02"
//                     onSelect={handleSelect}
//                     instName="guitar02"
//                     status={!isLoading}
//                   />
//                 </View>
//                 <View style={styles.row}>
//                   <TouchableBTN
//                     btnName="Bass"
//                     onSelect={handleSelect}
//                     instName="bass"
//                     status={!isLoading}
//                   />
//                   <TouchableBTN
//                     btnName="Keyboard"
//                     onSelect={handleSelect}
//                     instName="keys"
//                     status={!isLoading}
//                   />
//                 </View>
//                 <View style={styles.row}>
//                   <TouchableBTN
//                     btnName="Drums"
//                     onSelect={handleSelect}
//                     instName="drums"
//                     status={!isLoading}
//                   />
//                   <TouchableBTN
//                     btnName="Vocals"
//                     onSelect={handleSelect}
//                     instName="voice"
//                     status={!isLoading}
//                   />
//                 </View>
//               </View>

//               {/* botões de ações */}
//               <View style={styles.row}>
//                 <TouchableBTN
//                   btnName="Videos"
//                   status={!isLoading}
//                   onSelect={handleSelect}
//                 />
//               </View>
//               <View style={styles.row}>
//                 <TouchableBTN
//                   btnName="Setlist"
//                   status={!isLoading}
//                   onSelect={handleSelect}
//                 />
//               </View>
//               <View style={styles.row}>
//                 <TouchableBTN
//                   btnName="Discard"
//                   bgColor="red"
//                   textColor="white"
//                   status={!isLoading}
//                   onSelect={handleSelect}
//                 />
//                 <TouchableBTN
//                   btnName="Save"
//                   bgColor="green"
//                   textColor="white"
//                   status={!isLoading}
//                   onSelect={handleSelect}
//                 />
//               </View>
//             </ScrollView>
//           </View>
//         </SafeAreaView>
//       </SafeAreaProvider>
//     </>
//   );
// };

// export default Plus;

// /* ──────────────── ESTILOS ──────────────── */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 12,
//   },
//   btnNeumorphic: {
//     flex: 1,
//     margin: 6,
//     borderRadius: 12,
//     padding: 10,
//   },
//   neumorphic: {
//     borderRadius: 12,
//     backgroundColor: "#e0e0e0",
//     padding: 12,
//     marginBottom: 24,
//     shadowColor: "#e0e0e0cf",
//     shadowOffset: { width: 10, height: 10 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   neumorphicMain: { marginBottom: 24 },
//   title: { fontSize: 22, fontWeight: "600", textAlign: "center" },
//   titleFormat: { fontSize: 18, fontWeight: "600", padding: 6 },
//   pick: { fontSize: 12, fontWeight: "600" },
//   titleInstrument: {
//     fontSize: 18,
//     fontWeight: "600",
//     padding: 10,
//     textAlign: "center",
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 6,
//   },
//   wrapper: { flex: 1 },
// });

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ActionSheetTemplate from "@/components/ActionSheetSong/ActionSheetSong";
import { ActionSheetRef } from "react-native-actions-sheet";
import { SelectPayload } from "@/components/FlatList/FlatList";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ──────────────── BOTÃO GENÉRICO ──────────────── */
type TouchableBTNProps = {
  btnName: string;
  bgColor?: string;
  textColor?: string;
  status?: boolean;
  instName?: string;
  onSelect: (payload: SelectPayload) => void;
};

const TouchableBTN = ({
  btnName,
  bgColor = "#E0E0E0",
  status = false,
  textColor = "#000",
  onSelect,
  instName,
}: TouchableBTNProps) => (
  <TouchableOpacity
    disabled={!status}
    style={[
      styles.btnNeumorphic,
      { backgroundColor: bgColor, opacity: status ? 0.4 : 1 },
    ]}
    onPress={() => onSelect({ instrument: instName } as SelectPayload)}
  >
    <Text style={[styles.titleInstrument, { color: textColor }]}>
      {btnName}
    </Text>
  </TouchableOpacity>
);

/* ──────────────── TELA PLUS ──────────────── */
const Plus = () => {
  const sheetRef = useRef<ActionSheetRef>(null);
  const [selected, setSelected] = useState<SelectPayload | null>(null);

  const [link, setLink] = useState<string>("");
  const [dataFromUrl, setDataFromUrl] = useState<string | null>(null);

  // [ADIÇÃO] começar SEMPRE em branco
  const [artist, setArtist] = useState<string>("");
  const [song, setSong] = useState<string>("");

  // loading existente
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const userEmail = "teste@teste.com";

  // helpers existentes
  const safeParse = (maybeJson: unknown) => {
    try {
      if (typeof maybeJson === "string") return JSON.parse(maybeJson);
      return maybeJson;
    } catch (e) {
      console.warn("[safeParse] falha ao fazer JSON.parse:", e);
      return null;
    }
  };

  const normalizeToArray = (obj: any): any[] => {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === "object") return Object.values(obj);
    return [];
  };

  const pickLatestWithArtistSong = (arr: any[]) =>
    [...arr]
      .reverse()
      .find(
        (it) => typeof it?.artist === "string" && typeof it?.song === "string"
      );

  // função existente
  const gettingSongData = useCallback(async () => {
    console.log("[gettingSongData] iniciando fetch...");
    try {
      const url = `https://api.live.eloygomes.com/api/alldata/${userEmail}`;
      const response = await axios.get(url);

      console.log(
        "[gettingSongData] status:",
        response?.status,
        "tipo data:",
        typeof response?.data
      );
      if (response?.data && typeof response.data === "object") {
        console.log(
          "[gettingSongData] chaves data:",
          Object.keys(response.data)
        );
      } else {
        console.log(
          "[gettingSongData] preview data:",
          String(response?.data).slice(0, 160)
        );
      }

      const dataStr =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);
      setDataFromUrl(dataStr);

      const parsed = safeParse(dataStr);
      const list = normalizeToArray(parsed);
      console.log(
        "[gettingSongData] normalizado p/ array? len=",
        Array.isArray(list) ? list.length : "n/a"
      );

      const latest = pickLatestWithArtistSong(list);
      if (latest) {
        console.log(
          "[gettingSongData] latest.artist/song:",
          latest.artist,
          latest.song
        );
        setArtist(latest.artist);
        setSong(latest.song);
        return true;
      } else {
        console.log(
          "[gettingSongData] nenhum item com artist/song encontrado — mantendo placeholders."
        );
        return false;
      }
    } catch (error: any) {
      console.error(
        "[gettingSongData] erro:",
        error?.message || String(error?.toString?.() ?? error)
      );
      return false;
    }
  }, [userEmail]);

  // polling existente
  const pollArtistSong = useCallback(
    async (attempts = 5, intervalMs = 1200) => {
      for (let i = 1; i <= attempts; i++) {
        console.log(`[poll] tentativa ${i}/${attempts}`);
        const ok = await gettingSongData();
        if (ok) return true;
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return false;
    },
    [gettingSongData]
  );

  // lógica existente
  const handleSubmit = useCallback(
    async (instrumentName: string, linkValue: string) => {
      if (isLoading) {
        console.log("[handleSubmit] ignorado — já está carregando.");
        return;
      }
      setIsLoading(true);
      setArtist("Carregando...");
      setSong("Carregando...");

      const email = userEmail;

      console.log(
        "[handleSubmit] start → instrumentName:",
        instrumentName,
        "link:",
        linkValue
      );

      try {
        // 1) verifica se já existe
        try {
          const res = await axios.post(
            "https://api.live.eloygomes.com/api/generalCifra",
            { instrument: instrumentName, link: linkValue }
          );

          console.log(
            "[generalCifra] status:",
            res?.status,
            "tipo data:",
            typeof res?.data
          );
          if (res?.data && typeof res.data === "object") {
            console.log("[generalCifra] chaves data:", Object.keys(res.data));
          }

          const str =
            typeof res.data === "string" ? res.data : JSON.stringify(res.data);
          setDataFromUrl(str);

          const parsed = safeParse(str);
          const directArtist = parsed?.artist;
          const directSong = parsed?.song;

          if (
            typeof directArtist === "string" &&
            typeof directSong === "string"
          ) {
            setArtist(directArtist);
            setSong(directSong);
            console.log(
              "[generalCifra] artist/song preenchidos direto do POST."
            );
          } else {
            console.log(
              "[generalCifra] sem artist/song no body → chamando GET consolidate."
            );
            await gettingSongData();
          }

          return;
        } catch (err: any) {
          const status = err?.response?.status;
          console.log("[generalCifra] erro status:", status);

          if (status !== 404) {
            console.error("[generalCifra] erro não 404:", err?.message || err);
            return;
          }
          console.log("[generalCifra] 404 → não existe. Indo para /scrape...");
        }

        // 2) não existe → scrape
        const scrapeRes = await axios.post(
          "https://api.live.eloygomes.com/api/scrape",
          {
            artist: "",
            song: "",
            email,
            instrument: instrumentName,
            instrument_progressbar: 0,
            link: linkValue,
          }
        );

        console.log(
          "[scrape] status:",
          scrapeRes?.status,
          "tipo data:",
          typeof scrapeRes?.data
        );
        if (scrapeRes?.data && typeof scrapeRes.data === "object") {
          console.log("[scrape] chaves data:", Object.keys(scrapeRes.data));
        }

        await AsyncStorage.setItem("fromWHERE", "URL");

        const ok = await pollArtistSong(6, 1200);
        if (!ok) {
          console.warn("[poll] não encontrou artist/song dentro do tempo.");
          await gettingSongData();
        } else {
          console.log("[poll] artist/song preenchidos com sucesso.");
        }
      } finally {
        setTimeout(() => setIsLoading(false), 150);
      }
    },
    [gettingSongData, pollArtistSong, userEmail, isLoading]
  );

  // [ADIÇÃO] manter artist/song vazios até usuário *começar* o fluxo (clicar no instrumento)
  const handleSelect = (payload: SelectPayload) => {
    console.log("[handleSelect] instrumento selecionado:", payload?.instrument);
    setArtist(""); // garante vazio ao abrir o sheet
    setSong(""); // garante vazio ao abrir o sheet
    setSelected(payload);
    sheetRef.current?.show();
  };

  // [ADIÇÃO] impede o auto-fetch inicial (mantém tudo em branco até inserir link)
  const [shouldAutoFetch] = useState(false);
  useEffect(() => {
    if (!shouldAutoFetch) return;
    gettingSongData();
  }, [gettingSongData, shouldAutoFetch]);

  return (
    <>
      <ActionSheetTemplate
        ref={sheetRef}
        selected={selected}
        onSubmit={handleSubmit}
        link={link}
        setLink={setLink}
      />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <View style={styles.container}>
            {/* título */}
            <View style={styles.neumorphic}>
              <Text style={styles.title}>Add new song</Text>
            </View>

            {/* cabeçalho de campos */}
            <View style={styles.neumorphic}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {isLoading && <ActivityIndicator size="small" />}
                <Text style={styles.titleFormat}>{artist}</Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {isLoading && <ActivityIndicator size="small" />}
                <Text style={styles.titleFormat}>{song}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.pick}>CAPO</Text>
                <Text style={styles.pick}>TOM</Text>
                <Text style={styles.pick}>TUNER</Text>
              </View>
            </View>

            {/* botões de instrumentos */}
            <ScrollView style={styles.wrapper}>
              <View style={styles.neumorphicMain}>
                <View style={styles.row}>
                  <TouchableBTN
                    btnName="Guitar 01"
                    onSelect={handleSelect}
                    instName="guitar01"
                    status={!isLoading}
                  />
                  <TouchableBTN
                    btnName="Guitar 02"
                    onSelect={handleSelect}
                    instName="guitar02"
                    status={!isLoading}
                  />
                </View>
                <View style={styles.row}>
                  <TouchableBTN
                    btnName="Bass"
                    onSelect={handleSelect}
                    instName="bass"
                    status={!isLoading}
                  />
                  <TouchableBTN
                    btnName="Keyboard"
                    onSelect={handleSelect}
                    instName="keys"
                    status={!isLoading}
                  />
                </View>
                <View style={styles.row}>
                  <TouchableBTN
                    btnName="Drums"
                    onSelect={handleSelect}
                    instName="drums"
                    status={!isLoading}
                  />
                  <TouchableBTN
                    btnName="Vocals"
                    onSelect={handleSelect}
                    instName="voice"
                    status={!isLoading}
                  />
                </View>
              </View>

              {/* botões de ações */}
              <View style={styles.row}>
                <TouchableBTN
                  btnName="Videos"
                  status={!isLoading}
                  onSelect={handleSelect}
                />
              </View>
              <View style={styles.row}>
                <TouchableBTN
                  btnName="Setlist"
                  status={!isLoading}
                  onSelect={handleSelect}
                />
              </View>
              <View style={styles.row}>
                <TouchableBTN
                  btnName="Discard"
                  bgColor="red"
                  textColor="white"
                  status={!isLoading}
                  onSelect={handleSelect}
                />
                <TouchableBTN
                  btnName="Save"
                  bgColor="green"
                  textColor="white"
                  status={!isLoading}
                  onSelect={handleSelect}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
};

export default Plus;

/* ──────────────── ESTILOS ──────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  btnNeumorphic: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    padding: 10,
  },
  neumorphic: {
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    padding: 12,
    marginBottom: 24,
    shadowColor: "#e0e0e0cf",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  neumorphicMain: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  titleFormat: { fontSize: 18, fontWeight: "600", padding: 6 },
  pick: { fontSize: 12, fontWeight: "600" },
  titleInstrument: {
    fontSize: 18,
    fontWeight: "600",
    padding: 10,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
  },
  wrapper: { flex: 1 },
});
