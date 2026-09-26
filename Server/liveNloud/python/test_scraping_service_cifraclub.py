import unittest

from bs4 import BeautifulSoup

from cifra_utils import sanitize_song_cifra
from scraping_service_cifraclub import _extract_cifra_text, _split_cifra_sections


class CifraClubScrapingTest(unittest.TestCase):
    def test_extractor_ignores_embedded_scripts(self):
        soup = BeautifulSoup(
            """
            <div class="cifra_cnt"><pre>B   C#m   F#\nKeep fishin'</pre>
              <script type="application/ld+json">{"@context":"https://schema.org"}</script>
              <script>self.__next_f.push([1,"5:[\\"$\\",\\"$L14\\"]"])</script>
            </div>
            """,
            "html.parser",
        )

        self.assertEqual(
            _extract_cifra_text(soup.select_one(".cifra_cnt")),
            "B   C#m   F#\nKeep fishin'",
        )

    def test_sanitizer_truncates_a_leaked_flight_payload(self):
        contaminated = (
            "B   C#m   F#\nKeep fishin'\n"
            '(B)5:["$","$L14",null,{"dangerouslySetInnerHTML":{}}]'
        )

        self.assertEqual(
            sanitize_song_cifra(contaminated),
            "B   C#m   F#\nKeep fishin'",
        )

    def test_bass_tab_without_opening_pipes_keeps_technique_spacing(self):
        bass_tab = (
            "G-----14----14----14----14-14-|\n"
            "D-------0h12--------0h12---12-|   (2X)\n"
            "A-0h12--------0h12------------|\n"
            "E-----------------------------|\n"
            "  (T) (P)(T)(P)(T)(P)(T)(P)(P)"
        )

        sections = _split_cifra_sections(bass_tab)

        self.assertEqual(sections["songTabs"], bass_tab)
        self.assertEqual(sections["songLyrics"], "")


if __name__ == "__main__":
    unittest.main()
