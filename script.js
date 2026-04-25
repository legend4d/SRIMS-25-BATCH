let participants = [];
let attachments = [];

// --- 1. PARTICIPANT TAG SYSTEM ---
function addParticipant() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();
    
    if (name && !participants.includes(name)) {
        participants.push(name);
        renderTags();
        input.value = ''; 
    }
}

function renderTags() {
    const container = document.getElementById('tagContainer');
    container.innerHTML = ''; 
    participants.forEach((name, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${name} <span class="remove-btn" onclick="removeTag(${index})">×</span>`;
        container.appendChild(tag);
    });
}

function removeTag(index) {
    participants.splice(index, 1);
    renderTags();
}

// --- 2. FIXED DEADLINE LOGIC ---
function checkDeadline() {
    const dateVal = document.getElementById('eventDate').value;
    const warning = document.getElementById('deadline-warning');
    
    // If no date is selected, keep the warning hidden
    if (!dateVal) {
        warning.style.display = 'none';
        return;
    }

    const eventDate = new Date(dateVal);
    const today = new Date();
    
    // Calculate difference in days
    const diffTime = today - eventDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Only show warning if date is picked AND it is older than 7 days 
    if (diffDays > 7) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
}

// --- 3. ATTACHMENT HANDLING ---
function addAttachment() {
    const nameInput = document.getElementById('attachmentName');
    const fileInput = document.getElementById('fileInput');
    const list = document.getElementById('attachmentList');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        const fileName = nameInput.value.trim() || fileInput.files[0].name;

        reader.onload = function(e) {
            attachments.push({
                name: fileName,
                data: e.target.result 
            });
            list.innerHTML += `<div class="text-success small">✅ Added: ${fileName}</div>`;
            nameInput.value = '';
            fileInput.value = '';
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// --- 4. PDF GENERATION LOGIC ---
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    // College Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RK DAMANI MEDICAL COLLEGE", 105, y, { align: "center" });
    y += 7;
    doc.setFontSize(10);
    doc.text("Shri RamChandra Institutes of Medical Sciences", 105, y, { align: "center" });
    y += 12;
    doc.setFontSize(12);
    doc.text("OFFICIAL EVENT PARTICIPATION REPORT", 105, y, { align: "center" });
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

    // Helper for sections
    const addSection = (title, value) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title + ":", 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const text = value || "Not specified";
        const lines = doc.splitTextToSize(text, 170);
        doc.text(lines, 20, y);
        y += (lines.length * 6) + 8;
        
        if (y > 275) { doc.addPage(); y = 20; }
    };

    // Mapping Student Council Structure [cite: 13-32]
    addSection("1. Event Details", 
        `Event Name: ${document.getElementById('eventName').value}\n` +
        `Organizing Body: ${document.getElementById('orgBody').value}\n` +
        `Date & Venue: ${document.getElementById('eventDate').value} | ${document.getElementById('venue').value}\n` +
        `Year/Course: ${document.getElementById('yearCourse').value}`);

    addSection("2. Names of Participants", participants.length > 0 ? participants.join(", ") : "None listed");
    addSection("3. Objective of Participation", document.getElementById('objective').value);
    addSection("4. Summary of Activities", document.getElementById('summary').value);
    addSection("5. Achievements/Outcomes", document.getElementById('achievements').value);
    addSection("6. Financial Details", document.getElementById('financials').value);
    addSection("7. Overall Experience & Learning", document.getElementById('learning').value);
    addSection("8. Suggestions/Feedback", document.getElementById('feedback').value);

    // --- 5. ATTACHMENTS WITH ASPECT RATIO FIX ---
    for (const att of attachments) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        doc.text(`Attachment: ${att.name}`, 20, y);
        y += 10;

        const img = new Image();
        img.src = att.data;
        await new Promise(resolve => { img.onload = resolve; });

        const maxWidth = 170;
        const maxHeight = 220;
        let imgWidth = img.width;
        let imgHeight = img.height;
        const ratio = imgWidth / imgHeight;

        if (imgWidth > maxWidth) {
            imgWidth = maxWidth;
            imgHeight = imgWidth / ratio;
        }
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * ratio;
        }

        doc.addImage(att.data, 'JPEG', 20, y, imgWidth, imgHeight);
    }

    // --- 6. FOOTER ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Generated by RKDMC Student Reporting Tool", 105, 288, { align: "center" });
    }

    doc.save(`RKDMC_Report_${document.getElementById('eventName').value || 'Event'}.pdf`);
}