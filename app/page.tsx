
"use client";

import { useState } from "react";
import jsPDF from "jspdf";

type Photo = {
  data: string;
  caption: string;
};

type Theme = {
  name: string;
  main: [number, number, number];
  light: [number, number, number];
  accent: [number, number, number];
};

const themes: Record<string, Theme> = {
  biru: {
    name: "Biru Profesional",
    main: [25, 73, 112],
    light: [225, 240, 250],
    accent: [22, 155, 170],
  },
  hijau: {
    name: "Hijau Pendidikan",
    main: [35, 105, 75],
    light: [228, 243, 233],
    accent: [112, 166, 91],
  },
  ungu: {
    name: "Ungu Kreatif",
    main: [94, 65, 145],
    light: [239, 232, 250],
    accent: [177, 124, 210],
  },
  jingga: {
    name: "Jingga Ceria",
    main: [166, 83, 26],
    light: [255, 239, 220],
    accent: [240, 166, 65],
  },
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca fail."));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [themeName, setThemeName] = useState("biru");
  const theme = themes[themeName];

  const [form, setForm] = useState({
    sekolah: "",
    program: "",
    tarikh: new Date().toLocaleDateString("en-CA"),
    masa: "",
    tempat: "",
    penganjur: "",
    objektif: "",
    aktiviti: "",
    hasil: "",
    refleksi: "",
    penyedia: "",
    jawatan: "",
  });

  const [logo, setLogo] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [mesej, setMesej] = useState("");

  function update(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMesej("Logo mestilah dalam format PNG atau JPG.");
      return;
    }

    try {
      setLogo(await readFile(file));
      setMesej("");
    } catch {
      setMesej("Logo tidak berjaya dibaca.");
    }
  }

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 4);

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setMesej("Sila pilih fail gambar sahaja.");
      return;
    }

    try {
      const results = await Promise.all(
        files.map(async (file) => ({
          data: await readFile(file),
          caption: file.name.replace(/\.[^/.]+$/, ""),
        }))
      );

      setPhotos(results);
      setMesej("");
    } catch {
      setMesej("Gambar tidak berjaya dibaca.");
    }
  }

  function updateCaption(index: number, caption: string) {
    setPhotos((old) =>
      old.map((photo, i) =>
        i === index ? { ...photo, caption } : photo
      )
    );
  }
  
  function deletePhoto(index: number) {
  setPhotos((old) => old.filter((_, i) => i !== index));
}

function deleteAllPhotos() {
  setPhotos([]);
}

  function generatePDF() {
    if (!form.program.trim()) {
      setMesej("Sila isi nama program terlebih dahulu.");
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageW = 210;
      const margin = 10;
      const contentW = pageW - margin * 2;
      const c = theme.main;
      const light = theme.light;
      const accent = theme.accent;

      function text(
        value: string,
        x: number,
        y: number,
        width: number,
        maxLines: number,
        size = 8
      ) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(45, 52, 60);

        let lines = pdf.splitTextToSize(value || "-", width) as string[];

        if (lines.length > maxLines) {
          lines = lines.slice(0, maxLines);
          let last = lines[maxLines - 1];

          while (
            last.length > 0 &&
            pdf.getTextWidth(last + "...") > width
          ) {
            last = last.slice(0, -1);
          }

          lines[maxLines - 1] = last + "...";
        }

        pdf.text(lines, x, y, { lineHeightFactor: 1.2 });
      }

      function heading(
        label: string,
        x: number,
        y: number,
        width: number
      ) {
        pdf.setFillColor(...light);
        pdf.roundedRect(x, y, width, 6, 1.5, 1.5, "F");
        pdf.setFillColor(...accent);
        pdf.rect(x, y, 1.5, 6, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...c);
        pdf.text(label.toUpperCase(), x + 4, y + 4);
      }

      function field(
        label: string,
        value: string,
        x: number,
        y: number,
        width: number,
        lines = 2
      ) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...c);
        pdf.text(label.toUpperCase(), x, y);
        text(value, x, y + 4, width, lines, 8);
      }

      // Kepala laporan
      pdf.setFillColor(...c);
      pdf.rect(0, 0, pageW, 31, "F");
      pdf.setFillColor(...accent);
      pdf.rect(0, 29, pageW, 2, "F");

      if (logo) {
        try {
          const type = logo.startsWith("data:image/png")
            ? "PNG"
            : "JPEG";
          pdf.addImage(logo, type, margin, 4, 22, 22, undefined, "FAST");
        } catch {
          // Teruskan tanpa logo jika fail tidak dapat dimasukkan.
        }
      }

      const titleX = logo ? 36 : margin;
      const titleW = pageW - titleX - margin;

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);

      const schoolLines = pdf.splitTextToSize(
        form.sekolah || "NAMA SEKOLAH",
        titleW
      ) as string[];

      pdf.text(schoolLines.slice(0, 2), titleX, 10);

      pdf.setFontSize(10);
      pdf.text("ONE PAGE REPORT (OPR)", titleX, 22);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("LAPORAN PROGRAM DAN AKTIVITI SEKOLAH", titleX, 27);

      // Tajuk program
      pdf.setTextColor(...c);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);

      const programLines = pdf.splitTextToSize(
        form.program.toUpperCase(),
        contentW
      ) as string[];

      pdf.text(programLines.slice(0, 2), margin, 39);

      pdf.setDrawColor(...accent);
      pdf.setLineWidth(0.7);
      pdf.line(margin, 43, pageW - margin, 43);

      // Maklumat program
      heading("A. Maklumat Program", margin, 46, contentW);

      field("Tarikh", form.tarikh, margin + 2, 57, 42);
      field("Masa", form.masa, 65, 57, 42);
      field("Tempat", form.tempat, 120, 57, 76);

      field("Penganjur", form.penganjur, margin + 2, 69, 90);
      field("Tema warna", theme.name, 110, 69, 86);

      // Objektif
      heading("B. Objektif", margin, 77, contentW);
      text(form.objektif, margin + 3, 87, contentW - 6, 3, 8);

      // Pelaksanaan
      heading("C. Pelaksanaan Aktiviti", margin, 106, contentW);
      text(form.aktiviti, margin + 3, 116, contentW - 6, 3, 8);

      // Hasil
      heading("D. Hasil / Impak", margin, 135, contentW);
      text(form.hasil, margin + 3, 145, contentW - 6, 3, 8);

      // Refleksi
      heading("E. Refleksi / Penambahbaikan", margin, 164, contentW);
      text(form.refleksi, margin + 3, 174, contentW - 6, 3, 8);

      // Gambar
      heading("F. Dokumentasi Bergambar", margin, 193, contentW);

      const gap = 5;
      const imgW = (contentW - gap) / 2;
      const imgH = 20;
      const startY = 202;

      photos.slice(0, 4).forEach((photo, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (imgW + gap);
        const y = startY + row * 24;

        pdf.setFillColor(245, 247, 249);
        pdf.roundedRect(x, y, imgW, imgH, 1, 1, "F");

        try {
          const type = photo.data.startsWith("data:image/png")
            ? "PNG"
            : "JPEG";
          pdf.addImage(
            photo.data,
            type,
            x,
            y,
            imgW,
            imgH,
            undefined,
            "FAST"
          );
        } catch {
          pdf.setFontSize(7);
          pdf.setTextColor(120, 120, 120);
          pdf.text("Gambar tidak dapat dipaparkan", x + 3, y + 10);
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(50, 50, 50);
        const caption = pdf.splitTextToSize(
          photo.caption || `Gambar ${index + 1}`,
          imgW
        ) as string[];
        pdf.text(caption[0] || "", x, y + 22.5);
      });

      // Penyedia sahaja
      pdf.setDrawColor(205, 212, 220);
      pdf.line(margin, 257, pageW - margin, 257);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...c);
      pdf.text("DISEDIAKAN OLEH", margin, 264);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(45, 52, 60);
      pdf.text(form.penyedia || "-", margin, 270);
      pdf.text(form.jawatan || "-", margin, 275);

      pdf.setFontSize(6.5);
      pdf.setTextColor(115, 120, 125);
      pdf.text(
        "Dokumen dijana menggunakan Sistem OPR Sekolah",
        pageW / 2,
        289,
        { align: "center" }
      );

      pdf.save("OPR-Sekolah.pdf");
      setMesej("PDF OPR berjaya dijana.");
    } catch (error) {
      console.error(error);
      setMesej("PDF gagal dijana. Cuba semula dengan gambar yang lebih kecil.");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "#334155",
  };

  function inputField(
    label: string,
    name: keyof typeof form,
    placeholder = "",
    multiline = false
  ) {
    return (
      <div className="field" key={name}>
        <label style={labelStyle} htmlFor={name}>
          {label}
        </label>
        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={form[name]}
            onChange={update}
            placeholder={placeholder}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        ) : (
          <input
            id={name}
            name={name}
            value={form[name]}
            onChange={update}
            placeholder={placeholder}
            style={inputStyle}
          />
        )}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        fontFamily: "Arial, sans-serif",
        color: "#1e293b",
      }}
    >
      <header
        style={{
          background: `linear-gradient(120deg, rgb(${theme.main.join(",")}), rgb(${theme.accent.join(",")}))`,
          color: "#fff",
          padding: "24px 16px",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "auto" }}>
          <h1 style={{ margin: 0, fontSize: 27 }}>OPR SEKOLAH</h1>
          <p style={{ marginBottom: 0 }}>
            Sistem Penjanaan One Page Report
          </p>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1000,
          margin: "24px auto",
          padding: "0 14px 30px",
        }}
      >
        <section
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 14,
            boxShadow: "0 3px 15px #0000000b",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Maklumat OPR</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Isi maklumat program. Kandungan PDF disusun untuk satu muka
            surat A4.
          </p>

          <div className="form-grid">
            {inputField("Nama sekolah", "sekolah", "Contoh: SK ...")}
            {inputField("Nama program", "program", "Nama aktiviti")}
            {inputField("Tarikh", "tarikh", "Contoh: 9 Oktober 2026")}
            {inputField("Masa", "masa", "Contoh: 7.30 pagi – 12.30 tengah hari")}
            {inputField("Tempat", "tempat", "Lokasi program")}
            {inputField("Penganjur", "penganjur", "Unit / panitia / jawatankuasa")}
            {inputField("Objektif", "objektif", "Tujuan program...", true)}
            {inputField("Pelaksanaan aktiviti", "aktiviti", "Aktiviti yang dijalankan...", true)}
            {inputField("Hasil / impak", "hasil", "Pencapaian dan kesan program...", true)}
            {inputField("Refleksi / penambahbaikan", "refleksi", "Cadangan penambahbaikan...", true)}
            {inputField("Nama penyedia", "penyedia", "Nama guru")}
            {inputField("Jawatan penyedia", "jawatan", "Contoh: Setiausaha Program")}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "24px 0" }} />

          <h3>Tema warna OPR</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Pilih tema. Warna paparan dan PDF akan berubah secara automatik.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
              gap: 10,
            }}
          >
            {Object.entries(themes).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setThemeName(key)}
                style={{
                  background: `rgb(${value.main.join(",")})`,
                  color: "#fff",
                  border: themeName === key ? "3px solid #0f172a" : "3px solid transparent",
                  borderRadius: 10,
                  padding: "13px 8px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {value.name}
                {themeName === key ? " ✓" : ""}
              </button>
            ))}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "24px 0" }} />

          <h3>Logo sekolah</h3>
          <label style={labelStyle} htmlFor="logo">
            Muat naik logo (PNG atau JPG)
          </label>
          <input
            id="logo"
            type="file"
            accept="image/png,image/jpeg"
            onChange={uploadLogo}
          />
          {logo && (
            <div style={{ marginTop: 10 }}>
              <img
                src={logo}
                alt="Pratonton logo sekolah"
                style={{ width: 90, height: 90, objectFit: "contain" }}
              />
              <button type="button" onClick={() => setLogo("")}>
                Buang logo
              </button>
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "24px 0" }} />

          <h3>Gambar aktiviti</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Pilih sehingga 4 gambar. Gunakan gambar yang tidak terlalu besar
            supaya PDF lebih mudah dijana.
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={uploadPhotos}
          />

          {photos.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
            >
              {photos.map((photo, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: 8,
                  }}
                >
                  <img
                    src={photo.data}
                    alt={`Aktiviti ${index + 1}`}
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                  <input
  value={photo.caption}
  onChange={(e) => updateCaption(index, e.target.value)}
  style={inputStyle}
/>

<button
  type="button"
  onClick={() => deletePhoto(index)}
  style={{
    marginTop: 8,
    padding: "8px 12px",
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 6,
    cursor: "pointer",
  }}
>
  ✕ Padam gambar
</button>
                  />
                </div>
              ))}
            </div>
          )}

          {mesej && (
            <p
              role="status"
              style={{
                background: "#f0f9ff",
                color: "#075985",
                padding: 12,
                borderRadius: 8,
                marginTop: 18,
              }}
            >
              {mesej}
            </p>
          )}

          <button
            type="button"
            onClick={generatePDF}
            style={{
              width: "100%",
              marginTop: 22,
              padding: 15,
              background: `rgb(${theme.main.join(",")})`,
              color: "#fff",
              border: 0,
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Jana dan Muat Turun PDF A4
          </button>
        </section>

        <p style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}>
          Sistem OPR Sekolah • PDF A4 satu muka surat
        </p>
      </div>
    </main>
  );
}
