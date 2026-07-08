import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "app:language";

export const LANGUAGES = [
  { code: "en-US", shortLabel: "ENG", flag: "🇺🇸" },
  { code: "pt-BR", shortLabel: "BRA", flag: "🇧🇷" },
  { code: "es-ES", shortLabel: "ESP", flag: "🇪🇸" },
];

const translations = {
  "en-US": {
    nav: {
      chordLibrary: "Chord Library",
      tuner: "Tuner",
      calendar: "Calendar",
      metronome: "Metronome",
      songlist: "Songlist",
      yourSongs: "Your Songs",
      tools: "Tools",
      practiceUtilities: "Practice Utilities",
      userHub: "User Hub",
      accountSettings: "Account & Settings",
      sustenido: "Sustenido",
      yourRoutine: "Your Routine",
      plus: "Add",
      user: "User",
      openSearch: "Open search",
      openFilters: "Open filters",
    },
    userHub: {
      account: "Account",
      title: "User Hub",
      hello: "Hello @{username}",
      close: "Close",
      menu: "Menu",
      userInfo: "User Info",
      userData: "User Data",
      friends: "Friends",
      settings: "Settings",
      footswitch: "Footswitch",
      logs: "Logs",
      signOut: "Sign Out",
    },
    settings: {
      usbDevices: "USB Devices",
      usbConnection: "USB device connection",
      usbDescription: "Manage USB devices connected to the system.",
      language: "Language",
      systemLanguage: "System Language",
      languageDescription: "Select the language used across the interface.",
      bluetooth: "Bluetooth",
      bluetoothConnection: "Bluetooth connection",
      bluetoothDescription: "Manage Bluetooth devices connected to the system.",
      on: "ON",
      off: "OFF",
    },
    songPages: {
      plus: "Add",
      edit: "Edit",
      newSong: "New Song",
      editSong: "Edit Song",
      newSongDescription:
        "Bring the song data, instrument sources, videos, and setlists together without leaving the page.",
      editSongDescription:
        "Update song info, revise links, and keep the current setlist structure without leaving context.",
      delete: "Delete",
      save: "Save",
      update: "Update",
      previousSong: "Previous song in selected setlist",
      nextSong: "Next song in selected setlist",
      songWorkspace: "Song Workspace",
      songData: "Song Data",
      mediaSetlist: "Media & Setlist",
      videos: "Videos",
      setlist: "Setlist",
      videosAdded: "{count} videos added",
      setlistsSelected: "{count} setlists selected",
      addVideoUrl: "Add a video URL for this song.",
      setlistHelp: "Select existing tags or create a new one for this song.",
      closeVideos: "Close videos modal",
      closeSetlist: "Close setlist modal",
    },
    instrumentModal: {
      details: "Instrument Details",
      urlHelp: "Insert the URL that will be scraped for this instrument.",
      linkSource: "Link Source",
      linkPlaceholder: "Insert your link here",
      pasteFromClipboard: "Paste from clipboard",
      play: "Play",
      playHelp: "Open this instrument in presentation mode.",
      openLink: "Open Link",
      openLinkHelp: "Visit the original source in a new tab.",
      remove: "Remove",
      removeEditHelp: "Clear this instrument link and chart.",
      removeNewHelp: "Clear this instrument link.",
      progression: "Progression",
      progressionHelp: "Set how ready this instrument is for rehearsal or live use.",
      notes: "Notes",
      notesPlaceholder: "Write instrument notes here",
      notesAutoSave: "Notes save automatically when you leave this field.",
      addGp: "Add GP",
      view: "View",
      closeNotes: "Close notes modal",
      closeInstrument: "Close instrument modal",
    },
  },
  "pt-BR": {
    nav: {
      chordLibrary: "Biblioteca de Acordes",
      tuner: "Afinador",
      calendar: "Calendário",
      metronome: "Metrônomo",
      songlist: "Lista de Músicas",
      yourSongs: "Suas Músicas",
      tools: "Ferramentas",
      practiceUtilities: "Utilitários de Prática",
      userHub: "Central do Usuário",
      accountSettings: "Conta e Configurações",
      sustenido: "Sustenido",
      yourRoutine: "Sua Rotina",
      plus: "Adicionar",
      user: "Usuário",
      openSearch: "Abrir busca",
      openFilters: "Abrir filtros",
    },
    userHub: {
      account: "Conta",
      title: "Central do Usuário",
      hello: "Olá @{username}",
      close: "Fechar",
      menu: "Menu",
      userInfo: "Informações",
      userData: "Dados",
      friends: "Amigos",
      settings: "Configurações",
      footswitch: "Pedaleira",
      logs: "Logs",
      signOut: "Sair",
    },
    settings: {
      usbDevices: "Dispositivos USB",
      usbConnection: "Conexão de dispositivos USB",
      usbDescription: "Gerencie dispositivos USB conectados ao sistema.",
      language: "Idioma",
      systemLanguage: "Idioma do Sistema",
      languageDescription: "Selecione o idioma usado na interface.",
      bluetooth: "Bluetooth",
      bluetoothConnection: "Conexão Bluetooth",
      bluetoothDescription: "Gerencie dispositivos Bluetooth conectados ao sistema.",
      on: "LIG",
      off: "DES",
    },
    songPages: {
      plus: "Adicionar",
      edit: "Editar",
      newSong: "Nova Música",
      editSong: "Editar Música",
      newSongDescription:
        "Reúna dados da música, fontes dos instrumentos, vídeos e setlists sem sair da página.",
      editSongDescription:
        "Atualize informações da música, revise links e mantenha a estrutura atual da setlist sem perder contexto.",
      delete: "Excluir",
      save: "Salvar",
      update: "Atualizar",
      previousSong: "Música anterior na setlist selecionada",
      nextSong: "Próxima música na setlist selecionada",
      songWorkspace: "Área da Música",
      songData: "Dados da Música",
      mediaSetlist: "Mídia e Setlist",
      videos: "Vídeos",
      setlist: "Setlist",
      videosAdded: "{count} vídeos adicionados",
      setlistsSelected: "{count} setlists selecionadas",
      addVideoUrl: "Adicione uma URL de vídeo para esta música.",
      setlistHelp: "Selecione tags existentes ou crie uma nova para esta música.",
      closeVideos: "Fechar modal de vídeos",
      closeSetlist: "Fechar modal de setlist",
    },
    instrumentModal: {
      details: "Detalhes do Instrumento",
      urlHelp: "Insira a URL que será extraída para este instrumento.",
      linkSource: "Fonte do Link",
      linkPlaceholder: "Insira seu link aqui",
      pasteFromClipboard: "Colar da área de transferência",
      play: "Tocar",
      playHelp: "Abrir este instrumento no modo apresentação.",
      openLink: "Abrir Link",
      openLinkHelp: "Visitar a fonte original em uma nova aba.",
      remove: "Remover",
      removeEditHelp: "Limpar o link e a cifra deste instrumento.",
      removeNewHelp: "Limpar o link deste instrumento.",
      progression: "Progresso",
      progressionHelp: "Defina o quanto este instrumento está pronto para ensaio ou apresentação.",
      notes: "Notas",
      notesPlaceholder: "Escreva notas do instrumento aqui",
      notesAutoSave: "As notas são salvas automaticamente ao sair deste campo.",
      addGp: "Adicionar GP",
      view: "Ver",
      closeNotes: "Fechar modal de notas",
      closeInstrument: "Fechar modal de instrumento",
    },
  },
  "es-ES": {
    nav: {
      chordLibrary: "Biblioteca de Acordes",
      tuner: "Afinador",
      calendar: "Calendario",
      metronome: "Metrónomo",
      songlist: "Lista de Canciones",
      yourSongs: "Tus Canciones",
      tools: "Herramientas",
      practiceUtilities: "Utilidades de Práctica",
      userHub: "Centro de Usuario",
      accountSettings: "Cuenta y Configuración",
      sustenido: "Sustenido",
      yourRoutine: "Tu Rutina",
      plus: "Agregar",
      user: "Usuario",
      openSearch: "Abrir búsqueda",
      openFilters: "Abrir filtros",
    },
    userHub: {
      account: "Cuenta",
      title: "Centro de Usuario",
      hello: "Hola @{username}",
      close: "Cerrar",
      menu: "Menú",
      userInfo: "Información",
      userData: "Datos",
      friends: "Amigos",
      settings: "Configuración",
      footswitch: "Pedalera",
      logs: "Registros",
      signOut: "Cerrar Sesión",
    },
    settings: {
      usbDevices: "Dispositivos USB",
      usbConnection: "Conexión de dispositivos USB",
      usbDescription: "Administra los dispositivos USB conectados al sistema.",
      language: "Idioma",
      systemLanguage: "Idioma del Sistema",
      languageDescription: "Selecciona el idioma usado en la interfaz.",
      bluetooth: "Bluetooth",
      bluetoothConnection: "Conexión Bluetooth",
      bluetoothDescription: "Administra los dispositivos Bluetooth conectados al sistema.",
      on: "ON",
      off: "OFF",
    },
    songPages: {
      plus: "Agregar",
      edit: "Editar",
      newSong: "Nueva Canción",
      editSong: "Editar Canción",
      newSongDescription:
        "Reúne datos de la canción, fuentes de instrumentos, videos y setlists sin salir de la página.",
      editSongDescription:
        "Actualiza la información de la canción, revisa enlaces y conserva la estructura actual del setlist sin perder contexto.",
      delete: "Eliminar",
      save: "Guardar",
      update: "Actualizar",
      previousSong: "Canción anterior en el setlist seleccionado",
      nextSong: "Siguiente canción en el setlist seleccionado",
      songWorkspace: "Área de la Canción",
      songData: "Datos de la Canción",
      mediaSetlist: "Medios y Setlist",
      videos: "Videos",
      setlist: "Setlist",
      videosAdded: "{count} videos agregados",
      setlistsSelected: "{count} setlists seleccionados",
      addVideoUrl: "Agrega una URL de video para esta canción.",
      setlistHelp: "Selecciona tags existentes o crea uno nuevo para esta canción.",
      closeVideos: "Cerrar modal de videos",
      closeSetlist: "Cerrar modal de setlist",
    },
    instrumentModal: {
      details: "Detalles del Instrumento",
      urlHelp: "Inserta la URL que se extraerá para este instrumento.",
      linkSource: "Fuente del Link",
      linkPlaceholder: "Inserta tu link aquí",
      pasteFromClipboard: "Pegar desde el portapapeles",
      play: "Reproducir",
      playHelp: "Abrir este instrumento en modo presentación.",
      openLink: "Abrir Link",
      openLinkHelp: "Visitar la fuente original en una nueva pestaña.",
      remove: "Eliminar",
      removeEditHelp: "Limpiar el link y la cifra de este instrumento.",
      removeNewHelp: "Limpiar el link de este instrumento.",
      progression: "Progreso",
      progressionHelp: "Define qué tan listo está este instrumento para ensayo o presentación.",
      notes: "Notas",
      notesPlaceholder: "Escribe notas del instrumento aquí",
      notesAutoSave: "Las notas se guardan automáticamente al salir de este campo.",
      addGp: "Agregar GP",
      view: "Ver",
      closeNotes: "Cerrar modal de notas",
      closeInstrument: "Cerrar modal de instrumento",
    },
  },
};

const LanguageContext = createContext(null);

function getNestedValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en-US";
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.some((item) => item.code === savedLanguage)
      ? savedLanguage
      : "en-US";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const t = (key, variables = {}) => {
      const translated =
        getNestedValue(translations[language], key) ??
        getNestedValue(translations["en-US"], key) ??
        key;

      return Object.entries(variables).reduce(
        (text, [name, replacement]) =>
          text.replaceAll(`{${name}}`, String(replacement)),
        translated,
      );
    };

    return { language, languages: LANGUAGES, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
}
