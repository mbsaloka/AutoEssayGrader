import fitz

doc = fitz.open("example.pdf")
print("Jumlah halaman:", len(doc))

# akses halaman pertama
page = doc[0]
text = page.get_text()
print(text)