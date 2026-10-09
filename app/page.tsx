
"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function Home() {
  const [form, setForm] = useState({
    sekolah: "",
    program: "",
    tarikh: "",
    masa: "",
    tempat: "",
    anjuran: "",
    objektif: "",
    aktiviti: "",
    pencapaian: "",
    refleksi: "",
    penyedia: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  function updateField(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updatePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(e.target.files || []));
  }

  async function generatePDF() {
    if (!form.sekolah || !form.program || !form.tarikh) {
      setMessage("Sila isi nama sekolah, nama program dan tarikh dahulu.");
      return;
    }

    setMessage("Sedang menjana PDF...");

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      function addText(label: string, value: string) {
        const text = value.trim() || "-";
        const lines = pdf.splitTextToSize(
          `${label}: ${text}`,
          maxWidth
        );

        if (y + lines.length * 6 > pageHeight - 18) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text(`${label}:`, margin, y);
        y += 6;

        pdf.setFont("helvetica", "normal");
        const valueLines = pdf.splitTextToSize(text, maxWidth);

        if (y + valueLines.length * 6 > pageHeight - 18) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(valueLines, margin, y);
        y += valueLines.length * 6 + 5;
      }

      pdf.setFillColor(22, 101, 52);
      pdf.rect(0, 0, pageWidth, 38, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("ONE PAGE REPORT (OPR)", margin, 17);
      pdf.setFontSize(10);
      pdf.text("LAPORAN PROGRAM / AKTIVITI SEKOLAH", margin, 27);

      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(10);
      y = 49;

      addText("Nama Sekolah", form.sekolah);
      addText("Nama Program", form.program);
      addText("Tarikh", form.tarikh);
      addText("Masa", form.masa);
      addText("Tempat", form.tempat);
      addText("Anjuran", form.anjuran);
      addText("Objektif", form.objektif);
      addText("Aktiviti Dilaksanakan", form.aktiviti);
      addText("Pencapaian / Hasil", form.pencapaian);
      addText("Refleksi / Cadangan Penambahbaikan", form.refleksi);
      addText("Disediakan oleh", form.penyedia);

      for (const file of photos) {
        if (!file.type.startsWith("image/")) continue;

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Gagal membaca gambar"));
          reader.readAsDataURL(file);
        });

        const imageType = file.type === "image/png" ? "PNG" : "JPEG";

        if (y > pageHeight - 75) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text("Gambar Aktiviti", margin, y);
        y += 5;

        const props = pdf.getImageProperties(dataUrl);
        const width = Math.min(maxWidth, 110);
        const height = (props.height * width) / props.width;
        const safeHeight = Math.min(height, 100);

        if (y + safeHeight > pageHeight - 15) {
          pdf.addPage();
          y = 20;
        }

        pdf.addImage(
          dataUrl,
          imageType,
          margin,
          y,
          width,
          safeHeight
        );
        y += safeHeight + 10;
      }

      pdf.save("OPR-Sekolah.pdf");
      setMessage("PDF OPR berjaya dijana dan dimuat turun.");
    } catch {
      setMessage("PDF gagal dijana. Cuba semula dengan gambar yang lebih kecil.");
    }
  }

  function field(
    label: string,
    name: keyof typeof form,
    multiline = false
  ) {
    return (
      <div className={`field ${multiline ? "full" : ""}`}>
        <label htmlFor={name}>{label}</label>
        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={form[name]}
            onChange={updateField}
            placeholder={`Masukkan ${label.toLowerCase()}`}
          />
        ) : (
          <input
            id={name}
            name={name}
            value={form[name]}
            onChange={updateField}
            required={["sekolah", "program", "tarikh"].includes(name)}
            type={name === "tarikh" ? "date" : "text"}
            placeholder={`Masukkan ${label.toLowerCase()}`}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <h1>Penjana OPR Sekolah</h1>
          <p>
            Sistem ringkas untuk menyediakan laporan program sekolah
            dan menjana PDF secara automatik.
          </p>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <h2>Maklumat Program</h2>
          <p className="section-description">
            Isi maklumat program dengan lengkap. Medan bertanda wajib
            perlu diisi sebelum PDF dijana.
          </p>

          <div className="form-grid">
            {field("Nama Sekolah", "sekolah")}
            {field("Nama Program / Aktiviti", "program")}
            {field("Tarikh", "tarikh")}
            {field("Masa", "masa")}
            {field("Tempat", "tempat")}
            {field("Anjuran", "anjuran")}
            {field("Objektif Program", "objektif", true)}
            {field("Aktiviti Dilaksanakan", "aktiviti", true)}
            {field("Pencapaian / Hasil", "pencapaian", true)}
            {field(
              "Refleksi / Cadangan Penambahbaikan",
              "refleksi",
              true
            )}
            {field("Disediakan oleh", "penyedia")}
          </div>
        </section>

        <section className="card">
          <h2>Gambar Aktiviti</h2>
          <p className="section-description">
            Pilih satu atau beberapa gambar daripada komputer anda.
            Gambar akan dimasukkan ke dalam PDF.
          </p>

          <div className="photo-input">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={updatePhotos}
            />
            <p>{photos.length} gambar dipilih</p>

            <div className="photo-preview">
              {photos.map((photo, index) => (
                <div key={`${photo.name}-${index}`}>
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Gambar aktiviti ${index + 1}`}
                  />
                  <p>{photo.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Jana Laporan</h2>
          <p className="section-description">
            Semak maklumat anda sebelum menjana dokumen PDF.
          </p>

          <div className="notice">
            PDF dijana terus dalam pelayar anda. Tiada API AI berbayar
            diperlukan dan gambar tidak dihantar ke pelayan aplikasi.
          </div>

          <div className="button-row" style={{ marginTop: 18 }}>
            <button className="btn btn-primary" onClick={generatePDF}>
              Jana dan Muat Turun PDF
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              Cetak Borang
            </button>
          </div>

          {message && (
            <p role="status" style={{ marginTop: 16 }}>
              {message}
            </p>
          )}
        </section>

        <footer className="footer">
          Penjana OPR Sekolah • Versi permulaan
        </footer>
      </main>
    </>
  );
}
