import unittest
from pathlib import Path

from app.services.analyzer import analyze_invoice_text
from app.services.ocr import extract_text

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "docs" / "data" / "sample_data"


def _analyze_sample(name: str) -> dict:
    text = extract_text(SAMPLES_DIR / name)["text"]
    return analyze_invoice_text(text)


class InvoiceProcessingRegressionTests(unittest.TestCase):
    def test_f_vat_2011_extracts_issue_place_and_line_items(self) -> None:
        analysis = _analyze_sample("f-vat_2011.pdf")

        self.assertEqual(analysis["invoice_number"], "FV 152011")
        self.assertEqual(analysis["issue_place"], "Opole")
        self.assertEqual(analysis["gross_amount"], "6 120,00")
        self.assertEqual(len(analysis["line_items"]), 2)

    def test_f_vat_perf_extracts_compact_pdf(self) -> None:
        analysis = _analyze_sample("f-vat_perf.pdf")

        self.assertEqual(analysis["invoice_number"], "7/2020")
        self.assertEqual(analysis["issue_date"], "2020-03-30")
        self.assertEqual(analysis["sale_date"], "2020-03-30")
        self.assertEqual(analysis["issue_place"], "Wrocław")
        self.assertEqual(analysis["seller_nip"], "111-111-11-11")
        self.assertEqual(analysis["buyer_nip"], "832-656-20-42")
        self.assertEqual(analysis["net_amount"], "2 970,00")
        self.assertEqual(analysis["vat_amount"], "237,60")
        self.assertEqual(analysis["gross_amount"], "3 207,60")
        self.assertEqual(len(analysis["line_items"]), 2)
        self.assertEqual(analysis["line_items"][0]["name"], "So perfumy 20ml")

    def test_f_vat_soft_extracts_orphan_rows(self) -> None:
        analysis = _analyze_sample("f-vat_soft.pdf")

        self.assertEqual(analysis["invoice_number"], "298/2010")
        self.assertEqual(analysis["issue_date"], "2010-12-11")
        self.assertEqual(analysis["sale_date"], "2010-12-11")
        self.assertEqual(analysis["issue_place"], "Gdańsk")
        self.assertEqual(analysis["seller_nip"], "555-555-55-55")
        self.assertEqual(analysis["buyer_nip"], "123-456-78-90")
        self.assertEqual(analysis["net_amount"], "3 808,20")
        self.assertEqual(analysis["vat_amount"], "837,80")
        self.assertEqual(analysis["gross_amount"], "4 646,00")
        self.assertEqual(len(analysis["line_items"]), 2)
        self.assertIn("HP 6730B", analysis["line_items"][0]["name"])
        self.assertIn("Microsoft VISTA", analysis["line_items"][1]["name"])


if __name__ == "__main__":
    unittest.main()
