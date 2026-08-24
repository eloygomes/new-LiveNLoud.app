import unittest
import html
import json

from bs4 import BeautifulSoup

from scraping_service_ultimate_guitar import (
    UltimateGuitarScrapeError,
    _assert_ug_chord_integrity,
    _body_from_ug_lines,
    _extract_store_content,
    get_ultimate_guitar_data,
    _parse_ug_content_lines,
)


class UltimateGuitarChordPreservationTests(unittest.TestCase):
    def render(self, content: str) -> str:
        return _body_from_ug_lines(_parse_ug_content_lines(content))

    def test_preserves_adjacent_chord_only_tokens(self):
        rendered = self.render(
            "[ch]A[/ch]  [ch]Amaj7[/ch] [ch]A[/ch]  [ch]A/G#[/ch]"
        )

        self.assertEqual(rendered, "A  Amaj7 A  A/G#")

    def test_recombines_split_slash_chords(self):
        tagged_bass = self.render(
            "[ch]Dmaj7[/ch]/[ch]F#[/ch]Something inside the cards"
        )
        bare_bass = self.render(
            "[ch]Dmaj7[/ch]/F# Something inside the cards"
        )

        self.assertEqual(
            tagged_bass,
            "Dmaj7/F#\nSomething inside the cards",
        )
        self.assertEqual(
            bare_bass,
            "Dmaj7/F#\n Something inside the cards",
        )

    def test_keeps_parenthesized_quality_with_chord(self):
        rendered = self.render("[ch]Bm[/ch](add11)And this is what I give to you")

        self.assertEqual(rendered, "Bm(add11)\nAnd this is what I give to you")

    def test_turns_ug_section_wrappers_into_visible_labels(self):
        rendered = self.render(
            "[chorus]\n[ch]A[/ch] I could die for you\n[/chorus]"
        )

        self.assertIn("[Chorus]", rendered)
        self.assertNotIn("[/chorus]", rendered)

    def test_preserves_real_i_could_die_for_you_regression(self):
        rendered = self.render(
            "[Intro]\n\n"
            "[ch]A[/ch]  [ch]Amaj7[/ch] [ch]A[/ch]  [ch]A/G#[/ch]\n\n"
            "[Verse]\n\n"
            "[tab] [ch]Dmaj7[/ch]/[ch]F#[/ch]              [ch]C#7[/ch]\n"
            " Something inside the cards I know is right[/tab]\n\n"
            "[Chorus]\n[ch]A[/ch] I could die for you"
        )

        self.assertIn("A  Amaj7 A  A/G#", rendered)
        self.assertIn(" Dmaj7/F#              C#7", rendered)
        self.assertIn("[Chorus]", rendered)
        self.assertNotIn("AAaA/G", rendered)
        self.assertNotIn("DF#j7", rendered)

    def test_reads_only_structured_store_content(self):
        content = (
            "[Intro]\n[ch]A[/ch]  [ch]Amaj7[/ch] [ch]A[/ch]  [ch]A/G#[/ch]\n"
            "[tab][ch]Dmaj7[/ch]/[ch]F#[/ch]  [ch]C#7[/ch][/tab]"
        )
        payload = {"store": {"page": {"data": {"tab_view": {"wiki_tab": {"content": content}}}}}}
        soup = BeautifulSoup(
            f'<div class="js-store" data-content="{html.escape(json.dumps(payload), quote=True)}"></div>',
            "html.parser",
        )

        rendered = _extract_store_content(soup)

        self.assertIn("A  Amaj7 A  A/G#", rendered)
        self.assertIn("Dmaj7/F#  C#7", rendered)

    def test_integrity_guard_rejects_changed_chord(self):
        with self.assertRaises(UltimateGuitarScrapeError):
            _assert_ug_chord_integrity(
                "[ch]Dmaj7/F#[/ch]",
                [{"type": "chords", "chords": "DF#j7"}],
            )

    def test_browser_wiki_tab_payload_is_authoritative(self):
        content = (
            "[Intro]\n\n"
            "[ch]A[/ch]  [ch]Amaj7[/ch] [ch]A[/ch]  [ch]A/G#[/ch]\n\n"
            "[Verse]\n"
            "[tab] [ch]Dmaj7[/ch]/[ch]F#[/ch]  [ch]C#7[/ch]\n"
            " Something inside the cards[/tab]\n"
            "[Chorus]"
        )

        result = get_ultimate_guitar_data(
            "https://tabs.ultimate-guitar.com/tab/red-hot-chili-peppers/"
            "i-could-die-for-you-chords-898085",
            source_content=content,
            source_content_format="ultimate_guitar_wiki_tab",
        )[0]

        self.assertIn("A  Amaj7 A  A/G#", result["song_cifra"])
        self.assertIn("Dmaj7/F#  C#7", result["song_cifra"])
        self.assertIn("[Chorus]", result["song_cifra"])
        self.assertNotIn("AAaA/G", result["song_cifra"])
        self.assertNotIn("DF#j7", result["song_cifra"])


if __name__ == "__main__":
    unittest.main()
