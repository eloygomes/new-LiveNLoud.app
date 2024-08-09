const FAKEDATA = [
  {
    id: 1,
    Song: "Snow",
    Artist: "Red Hot Chilli Peppers",
    progressBar: 14,
    Instruments: {
      guitar01: true,
      guitar02: false,
      bass: true,
      keys: true,
      drums: false,
      voice: true,
    },
    guitar01: {
      active: true,
      capo: "2 CASA",
      tom: "C Major",
      tuner: "Standard",
      lastPlay: "2010-06-01",
      progressBarG01: 30,
      url: "/presentation/1",
      songCifra:
        "\n" +
        '            <div class="toneFuseAdButton toneFuseAdButton--songAbove pub" id="js-toneFuseAds--songAbove"></div>\n' +
        "\n" +
        '            <span id="cifra_tom">\n' +
        "                            tom:\n" +
        '                <a class="js-modal-trigger" href="#" title="alterar o tom da cifra">G</a>                        </span>\n' +
        "\n" +
        '            <span data-cy="song-tuning" id="cifra_afi">\n' +
        "                        </span>\n" +
        '            <span data-cy="song-capo" id="cifra_capo">\n' +
        "                        </span>\n" +
        "\n" +
        "            <pre>[Intro] <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b>\n" +
        "        <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b> \n" +
        "        <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b> \n" +
        "        <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b>  \n" +
        "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D9/F#</b>  \n" +
        "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D9/F#</b>  \n" +
        "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D9/F#</b>  \n" +
        "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D</b>\n" +
        "\n" +
        '<span class="tablatura">[Tab - Violão Solo Intro]\n' +
        "\n" +
        "   <b>Em7</b>         <b>A7</b>\n" +
        '<span class="cnt">E|<u>------------------</u>0<u>---------------------------------</u>|\n' +
        "B|<u>-----</u>3<u>-----</u>3<u>----</u>2<u>---</u>2<u>-------------------------------</u>|\n" +
        "G|<u>---</u>0<u>-----</u>0<u>----</u>0<u>-------</u>0<u>-----------------------------</u>|\n" +
        "D|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">   <b>C</b>           <b>G</b>       <b>D</b>\n' +
        '<span class="cnt">E|<u>---------------</u>3<u>-----</u>2<u>------------------------------</u>|\n' +
        "B|<u>-----</u>1<u>-----</u>1<u>-----</u>3<u>-----</u>3<u>----------------------------</u>|\n" +
        "G|<u>---</u>0<u>-----</u>0<u>---------</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
        "D|<u>-</u>2<u>-----</u>2<u>-----</u>0<u>--------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">   <b>Em</b>       <b>D</b>          <b>C</b>\n' +
        '<span class="cnt">E|<u>-----</u>10<u>--------</u>7<u>-----------</u>5<u>-</u>3<u>----------------------</u>|\n' +
        "B|<u>---</u>8<u>-------------</u>5<u>-------</u>3<u>-----</u>5<u>-</u>3h5p3<u>--------------</u>|\n" +
        "G|<u>-</u>9<u>------</u>9\\7<u>-</u>7<u>------</u>7\\4<u>-</u>4<u>---------------</u>4\\<u>-----------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">   <b>Am</b>      <b>G</b>        <b>D</b>\n' +
        '<span class="cnt">E|<u>-----------</u>3<u>----------</u>2h3p2<u>-------------------------</u>|\n' +
        "B|<u>---</u>1<u>---------</u>3<u>------</u>3<u>-------</u>3<u>---</u>3<u>-------------------</u>|\n" +
        "G|<u>-----</u>2<u>---------</u>4<u>--</u>2<u>-----------</u>2<u>---</u>2<u>-----------------</u>|\n" +
        "D|<u>-</u>2<u>-----</u>2<u>-</u>0<u>------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">[Tab - Violão Base]\n' +
        "\n" +
        "   <b>Em</b>      <b>D</b>       <b>C</b>\n" +
        '<span class="cnt">E|<u>-</u>3<u>-----</u>3<u>-</u>2<u>-----</u>2<u>-</u>0<u>-----</u>0<u>----------------------------</u>|\n' +
        "B|<u>---</u>0<u>-------</u>3<u>-------</u>1<u>-----</u>1<u>--------------------------</u>|\n" +
        "G|<u>-----</u>0<u>-------</u>2<u>-------</u>0<u>-------</u>0<u>----------------------</u>|\n" +
        "D|<u>-</u>2<u>-------</u>0<u>------------------------------------------</u>|\n" +
        "A|<u>-----------------</u>3<u>---------</u>2<u>------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">   <b>Am</b>      <b>G</b>       <b>D9/F#</b>\n' +
        '<span class="cnt">E|<u>----------------------------------------------------</u>|\n' +
        "B|<u>-</u>1<u>-----</u>1<u>-</u>0<u>-----</u>0<u>--------</u>3<u>---------------------------</u>|\n" +
        "G|<u>---</u>2<u>-------</u>0<u>-----</u>2<u>----</u>2<u>---</u>2<u>---</u>2<u>---------------------</u>|\n" +
        "D|<u>-----</u>2<u>-------</u>0<u>---</u>0<u>--</u>0<u>-------</u>0<u>-----------------------</u>|\n" +
        "A|<u>-</u>0<u>---------------</u>0<u>----------------------------------</u>|\n" +
        "E|<u>---------</u>3<u>-------</u>2<u>----------------------------------</u>|</span></span>\n" +
        "\n" +
        "[Primeira Parte]\n" +
        "\n" +
        "                        <b>G</b>  <b>D</b>  <b>G</b>\n" +
        "Não sou escravo de ninguém\n" +
        "                          <b>D</b>    <b>A5(9)</b>  <b>D</b>\n" +
        "Ninguém, senhor do meu domínio\n" +
        "                     <b>C</b>\n" +
        "Sei o que devo defender\n" +
        "\n" +
        "E, por valor eu tenho\n" +
        "   <b>Em</b>                     <b>A7</b>  <b>D</b>\n" +
        "E temo o que agora se desfaz\n" +
        "\n" +
        "               <b>G</b>     <b>D</b>  <b>G</b>\n" +
        "Viajamos sete léguas\n" +
        "                        <b>D</b>     <b>A5(9)</b>  <b>D</b>\n" +
        "Por entre abismos e florestas\n" +
        "                          <b>C</b>\n" +
        "Por Deus nunca me vi tão só\n" +
        "                          <b>Em</b>\n" +
        "É a própria fé o que destrói\n" +
        "                    <b>A7</b>   <b>D</b>\n" +
        "Estes são dias desleais\n" +
        "\n" +
        "[Refrão]\n" +
        "\n" +
        "          <b>C/G</b>  <b>D9(11)/A</b>\n" +
        "Eu sou metal\n" +
        "                      <b>G</b>  <b>G/F#</b>  <b>Em</b>\n" +
        "Raio, relâmpago e trovão\n" +
        "          <b>C/G</b>  <b>D9(11)/A</b>\n" +
        "Eu sou metal\n" +
        "                         <b>G</b>  <b>G/F#</b>  <b>Em</b>\n" +
        "Eu sou o ouro em seu brasão\n" +
        "          <b>C/G</b>  <b>D9(11)/A</b>\n" +
        "Eu sou metal\n" +
        "                       <b>F7M(11+)</b>  <b>G</b>\n" +
        "Me sabe o sopro do dragão\n" +
        "\n" +
        "[Primeira Parte]\n" +
        "\n" +
        '<span class="tablatura">[Tab - Solo Primeira Parte]\n' +
        "\n" +
        "Parte 1 de 5\n" +
        '<span class="cnt">E|<u>-----</u>3<u>-----</u>3<u>----</u>5<u>-----</u>3<u>-----</u>3<u>-----------------------</u>|\n' +
        "B|<u>---</u>5<u>---</u>5<u>----------</u>5<u>-----</u>5<u>-----</u>5<u>---------------------</u>|\n" +
        "G|<u>-</u>5<u>-------</u>5<u>---</u>5<u>------</u>5<u>-----</u>5<u>-------------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">Parte 2 de 5\n' +
        '<span class="cnt">E|<u>---</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>------------------------------</u>|\n' +
        "B|<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>----------------------------</u>|\n" +
        "G|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">Parte 3 de 5\n' +
        '<span class="cnt">E|<u>---</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>------------------------------</u>|\n' +
        "B|<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>----------------------------</u>|\n" +
        "G|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">Parte 4 de 5\n' +
        '<span class="cnt">E|<u>---</u>1<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>------------------------------</u>|\n' +
        "B|<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>----------------------------</u>|\n" +
        "G|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">Parte 5 de 5\n' +
        '<span class="cnt">E|<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>----------------------------</u>|\n' +
        "B|<u>-------</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>--------------------------</u>|\n" +
        "G|<u>-</u>2/4<u>-----</u>4<u>-----</u>4<u>-----</u>4<u>-----</u>4<u>------------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        "<b>C</b>                  <b>Am</b>\n" +
        "  Reconheço meu pesar\n" +
        "        <b>Am/G</b>       <b>D9/F#</b>\n" +
        "Quando tudo é traição\n" +
        "                   <b>F7M(11+)</b>\n" +
        "O que venho encontrar\n" +
        "                       <b>G</b>\n" +
        "É a virtude em outras mãos\n" +
        "\n" +
        "[Segunda Parte]\n" +
        "\n" +
        '<span class="tablatura">[Tab - Solo Segunda Parte]\n' +
        "\n" +
        "[Parte 1 de 2]\n" +
        '<span class="cnt">E|<u>-</u>9/7<u>--</u>5<u>--</u>3<u>--</u>3<u>--</u>2<u>--</u>2h3p2<u>-----</u>2<u>-----------------------</u>|\n' +
        "B|<u>--------------------------</u>3<u>-------------------------</u>|\n" +
        "G|<u>-</u>9/7<u>--</u>6<u>--</u>4<u>--</u>4<u>--</u>2<u>--------</u>2<u>---------------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        '<span class="tablatura">Parte 2 de 2\n' +
        '<span class="cnt">E|<u>-------</u>3<u>-----</u>3<u>------</u>5\\4<u>-</u>4<u>-----</u>9<u>---------------------</u>|\n' +
        "B|<u>---------</u>3<u>-----</u>3<u>------------------------------------</u>|\n" +
        "G|<u>-</u>2<u>-</u>2/4<u>-----</u>4<u>-----</u>4<u>--</u>6\\4<u>-</u>4<u>-</u>7/9<u>-----------------------</u>|\n" +
        "D|<u>----------------------------------------------------</u>|\n" +
        "A|<u>----------------------------------------------------</u>|\n" +
        "E|<u>----------------------------------------------------</u>|</span></span>\n" +
        "\n" +
        "<b>A7</b>        <b>D</b>\n" +
        "   Minha terra\n" +
        "<b>G</b>      <b>E</b>           <b>A7</b>   <b>D</b>\n" +
        "  É a terra que é minha\n" +
        "            <b>G</b>  <b>E</",
    },
    guitar02: {
      active: false,
      capo: "2 CASA",
      tom: "C Major",
      tuner: "Standard",
      lastPlay: "2010-06-01",
      progressBarG01: 30,
      url: "https://www.cifraclub.com.br/pitty/cachorroquente/",
    },
    bass: {
      active: true,
      capo: "2 CASA",
      tom: "C Major",
      tuner: "Standard",
      lastPlay: "2010-06-01",
      progressBarG01: 30,
      url: "https://www.cifraclub.com.br/pitty/baixaone/",
    },
    keys: {
      active: false,
      capo: "2 CASA",
      tom: "C Major",
      tuner: "Standard",
      lastPlay: "2010-06-01",
      progressBarG01: 30,
      url: "https://www.cifraclub.com.br/pitty/teclasdechocolate/",
    },
    drums: {
      active: true,
      capo: "2 CASA",
      tom: "C Major",
      tuner: "Standard",
      lastPlay: "2010-06-01",
      progressBarG01: 30,
      url: "https://www.cifraclub.com.br/pitty/cramulhaotocandoviola/",
    },
    voice: {
      active: true,
      capo: "2 CASA",
      tom: "C Major",
      tuner: "Standard",
      lastPlay: "2010-06-01",
      progressBarG01: 30,
      url: "https://www.cifraclub.com.br/pitty/voicedodiabo/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=5e3DUPh3vkg",
      "https://www.youtube.com/watch?v=5e3DUPh3vkg",
      "https://www.youtube.com/watch?v=5e3DUPh3vkg",
    ],
    AddedIn: "2005-12-01",
  },
  {
    id: 2,
    Song: "Californication",
    Artist: "Red Hot Chili Peppers",
    progressBar: 60,
    Instruments: {
      guitar01: true,
      guitar02: true,
      bass: true,
      Keys: false,
      Drums: true,
      Voice: true,
    },
    guitar01: {
      active: true,
      capo: "1 CASA",
      tom: "G Major",
      tuner: "Drop D",
      lastPlay: "2012-05-15",
      progressBarG01: 45,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/californication/",
    },
    guitar02: {
      active: true,
      capo: "1 CASA",
      tom: "G Major",
      tuner: "Drop D",
      lastPlay: "2012-05-15",
      progressBarG01: 45,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/californication/",
    },
    bass: {
      active: true,
      capo: "1 CASA",
      tom: "G Major",
      tuner: "Drop D",
      lastPlay: "2012-05-15",
      progressBarG01: 45,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/californication/",
    },
    Keys: {
      active: false,
      capo: "1 CASA",
      tom: "G Major",
      tuner: "Drop D",
      lastPlay: "2012-05-15",
      progressBarG01: 45,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/californication/",
    },
    Drums: {
      active: true,
      capo: "1 CASA",
      tom: "G Major",
      tuner: "Drop D",
      lastPlay: "2012-05-15",
      progressBarG01: 45,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/californication/",
    },
    Voice: {
      active: true,
      capo: "1 CASA",
      tom: "G Major",
      tuner: "Drop D",
      lastPlay: "2012-05-15",
      progressBarG01: 45,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/californication/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=YlUKcNNmywk",
      "https://www.youtube.com/watch?v=YlUKcNNmywk",
      "https://www.youtube.com/watch?v=YlUKcNNmywk",
    ],
    AddedIn: "2000-03-15",
  },
  {
    id: 3,
    Song: "Under the Bridge",
    Artist: "Red Hot Chili Peppers",
    progressBar: 85,
    Instruments: {
      guitar01: true,
      guitar02: false,
      bass: true,
      Keys: true,
      Drums: true,
      Voice: true,
    },
    guitar01: {
      active: true,
      capo: "3 CASA",
      tom: "E Minor",
      tuner: "Standard",
      lastPlay: "2015-08-20",
      progressBarG01: 70,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/under-the-bridge/",
    },
    guitar02: {
      active: false,
      capo: "3 CASA",
      tom: "E Minor",
      tuner: "Standard",
      lastPlay: "2015-08-20",
      progressBarG01: 70,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/under-the-bridge/",
    },
    bass: {
      active: true,
      capo: "3 CASA",
      tom: "E Minor",
      tuner: "Standard",
      lastPlay: "2015-08-20",
      progressBarG01: 70,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/under-the-bridge/",
    },
    Keys: {
      active: true,
      capo: "3 CASA",
      tom: "E Minor",
      tuner: "Standard",
      lastPlay: "2015-08-20",
      progressBarG01: 70,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/under-the-bridge/",
    },
    Drums: {
      active: true,
      capo: "3 CASA",
      tom: "E Minor",
      tuner: "Standard",
      lastPlay: "2015-08-20",
      progressBarG01: 70,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/under-the-bridge/",
    },
    Voice: {
      active: true,
      capo: "3 CASA",
      tom: "E Minor",
      tuner: "Standard",
      lastPlay: "2015-08-20",
      progressBarG01: 70,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/under-the-bridge/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=lwlogyj7nFE",
      "https://www.youtube.com/watch?v=lwlogyj7nFE",
      "https://www.youtube.com/watch?v=lwlogyj7nFE",
    ],
    AddedIn: "1992-04-15",
  },
  {
    id: 4,
    Song: "Scar Tissue",
    Artist: "Red Hot Chili Peppers",
    progressBar: 45,
    Instruments: {
      guitar01: true,
      guitar02: false,
      bass: true,
      Keys: true,
      Drums: false,
      Voice: true,
    },
    guitar01: {
      active: true,
      capo: "4 CASA",
      tom: "A Major",
      tuner: "Half-Step Down",
      lastPlay: "2018-11-10",
      progressBarG01: 50,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/scar-tissue/",
    },
    guitar02: {
      active: false,
      capo: "4 CASA",
      tom: "A Major",
      tuner: "Half-Step Down",
      lastPlay: "2018-11-10",
      progressBarG01: 50,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/scar-tissue/",
    },
    bass: {
      active: true,
      capo: "4 CASA",
      tom: "A Major",
      tuner: "Half-Step Down",
      lastPlay: "2018-11-10",
      progressBarG01: 50,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/scar-tissue/",
    },
    Keys: {
      active: true,
      capo: "4 CASA",
      tom: "A Major",
      tuner: "Half-Step Down",
      lastPlay: "2018-11-10",
      progressBarG01: 50,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/scar-tissue/",
    },
    Drums: {
      active: false,
      capo: "4 CASA",
      tom: "A Major",
      tuner: "Half-Step Down",
      lastPlay: "2018-11-10",
      progressBarG01: 50,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/scar-tissue/",
    },
    Voice: {
      active: true,
      capo: "4 CASA",
      tom: "A Major",
      tuner: "Half-Step Down",
      lastPlay: "2018-11-10",
      progressBarG01: 50,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/scar-tissue/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=mzJj5-lubeM",
      "https://www.youtube.com/watch?v=mzJj5-lubeM",
      "https://www.youtube.com/watch?v=mzJj5-lubeM",
    ],
    AddedIn: "1999-09-21",
  },
  {
    id: 5,
    Song: "Otherside",
    Artist: "Red Hot Chili Peppers",
    progressBar: 50,
    Instruments: {
      guitar01: true,
      guitar02: false,
      bass: true,
      Keys: true,
      Drums: true,
      Voice: true,
    },
    guitar01: {
      active: true,
      capo: "2 CASA",
      tom: "A Minor",
      tuner: "Standard",
      lastPlay: "2016-02-14",
      progressBarG01: 65,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/otherside/",
    },
    guitar02: {
      active: false,
      capo: "2 CASA",
      tom: "A Minor",
      tuner: "Standard",
      lastPlay: "2016-02-14",
      progressBarG01: 65,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/otherside/",
    },
    bass: {
      active: true,
      capo: "2 CASA",
      tom: "A Minor",
      tuner: "Standard",
      lastPlay: "2016-02-14",
      progressBarG01: 65,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/otherside/",
    },
    Keys: {
      active: true,
      capo: "2 CASA",
      tom: "A Minor",
      tuner: "Standard",
      lastPlay: "2016-02-14",
      progressBarG01: 65,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/otherside/",
    },
    Drums: {
      active: true,
      capo: "2 CASA",
      tom: "A Minor",
      tuner: "Standard",
      lastPlay: "2016-02-14",
      progressBarG01: 65,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/otherside/",
    },
    Voice: {
      active: true,
      capo: "2 CASA",
      tom: "A Minor",
      tuner: "Standard",
      lastPlay: "2016-02-14",
      progressBarG01: 65,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/otherside/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=rn_YodiJO6k",
      "https://www.youtube.com/watch?v=rn_YodiJO6k",
      "https://www.youtube.com/watch?v=rn_YodiJO6k",
    ],
    AddedIn: "2001-07-23",
  },
  {
    id: 7,
    Song: "Dani California",
    Artist: "Red Hot Chili Peppers",
    progressBar: 20,
    Instruments: {
      guitar01: true,
      guitar02: true,
      bass: true,
      Keys: false,
      Drums: true,
      Voice: true,
    },
    guitar01: {
      active: true,
      capo: "5 CASA",
      tom: "D Minor",
      tuner: "Standard",
      lastPlay: "2021-03-10",
      progressBarG01: 25,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/dani-california/",
    },
    guitar02: {
      active: true,
      capo: "5 CASA",
      tom: "D Minor",
      tuner: "Standard",
      lastPlay: "2021-03-10",
      progressBarG01: 25,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/dani-california/",
    },
    bass: {
      active: true,
      capo: "5 CASA",
      tom: "D Minor",
      tuner: "Standard",
      lastPlay: "2021-03-10",
      progressBarG01: 25,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/dani-california/",
    },
    Keys: {
      active: false,
      capo: "5 CASA",
      tom: "D Minor",
      tuner: "Standard",
      lastPlay: "2021-03-10",
      progressBarG01: 25,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/dani-california/",
    },
    Drums: {
      active: true,
      capo: "5 CASA",
      tom: "D Minor",
      tuner: "Standard",
      lastPlay: "2021-03-10",
      progressBarG01: 25,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/dani-california/",
    },
    Voice: {
      active: true,
      capo: "5 CASA",
      tom: "D Minor",
      tuner: "Standard",
      lastPlay: "2021-03-10",
      progressBarG01: 25,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/dani-california/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=Sb5aq5HcS1A",
      "https://www.youtube.com/watch?v=Sb5aq5HcS1A",
      "https://www.youtube.com/watch?v=Sb5aq5HcS1A",
    ],
    AddedIn: "2006-05-09",
  },
  {
    id: 8,
    Song: "Can't Stop",
    Artist: "Red Hot Chili Peppers",
    progressBar: 90,
    Instruments: {
      guitar01: true,
      guitar02: true,
      bass: true,
      Keys: false,
      Drums: true,
      Voice: true,
    },
    guitar01: {
      active: true,
      capo: "None",
      tom: "F Major",
      tuner: "Standard",
      lastPlay: "2019-07-18",
      progressBarG01: 95,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/cant-stop/",
    },
    guitar02: {
      active: true,
      capo: "None",
      tom: "F Major",
      tuner: "Standard",
      lastPlay: "2019-07-18",
      progressBarG01: 95,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/cant-stop/",
    },
    bass: {
      active: true,
      capo: "None",
      tom: "F Major",
      tuner: "Standard",
      lastPlay: "2019-07-18",
      progressBarG01: 95,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/cant-stop/",
    },
    Keys: {
      active: false,
      capo: "None",
      tom: "F Major",
      tuner: "Standard",
      lastPlay: "2019-07-18",
      progressBarG01: 95,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/cant-stop/",
    },
    Drums: {
      active: true,
      capo: "None",
      tom: "F Major",
      tuner: "Standard",
      lastPlay: "2019-07-18",
      progressBarG01: 95,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/cant-stop/",
    },
    Voice: {
      active: true,
      capo: "None",
      tom: "F Major",
      tuner: "Standard",
      lastPlay: "2019-07-18",
      progressBarG01: 95,
      url: "https://www.cifraclub.com.br/red-hot-chili-peppers/cant-stop/",
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=BfOdWSiyWoc",
      "https://www.youtube.com/watch?v=BfOdWSiyWoc",
      "https://www.youtube.com/watch?v=BfOdWSiyWoc",
    ],
    AddedIn: "2003-01-31",
  },
];
export default FAKEDATA;
