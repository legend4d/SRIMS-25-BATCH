let participants = [];
let attachments = [];

// --- 1. PARTICIPANT TAG SYSTEM ---
function addParticipant() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();
    
    if (name && !participants.includes(name)) {
        participants.push(name);
        renderTags();
        saveProgress();
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
    saveProgress();
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

// --- ATTACHMENT HANDLING WITH REMOVE ---
function addAttachment() {
    const nameInput = document.getElementById('attachmentName');
    const fileInput = document.getElementById('fileInput');
    const list = document.getElementById('attachmentList');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        const fileName = nameInput.value.trim() || fileInput.files[0].name;

        reader.onload = function(e) {
            const id = Date.now(); // Unique ID to track for removal
            attachments.push({
                id: id,
                name: fileName,
                data: e.target.result 
            });
            renderAttachments();
            nameInput.value = '';
            fileInput.value = '';
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function renderAttachments() {
    const list = document.getElementById('attachmentList');
    list.innerHTML = '';
    attachments.forEach((att, index) => {
        list.innerHTML += `
            <div class="text-success small d-flex justify-content-between align-items-center mb-1" style="background: #252525; padding: 5px 10px; border-radius: 4px;">
                <span>✅ ${att.name}</span>
                <span class="text-danger" style="cursor:pointer; font-weight:bold;" onclick="removeAttachment(${index})">Remove</span>
            </div>`;
    });
}

function removeAttachment(index) {
    attachments.splice(index, 1);
    renderAttachments();
}

// --- NEW: CLEAR ALL FUNCTIONALITY ---
function clearAllData() {
    if (confirm("Are you sure you want to clear all fields? This cannot be undone.")) {
        // Clear LocalStorage
        localStorage.removeItem('rkdmc_draft');
        
        // Reload the page to reset everything naturally
        window.location.reload();
    }
}

// --- NEW: TOGGLE CLEAR BUTTON VISIBILITY ---
function toggleClearButton() {
    const clearBtn = document.getElementById('clearAllBtn');
    if (!clearBtn) return;

    // Check localStorage (now guaranteed to be null if empty)
    const savedDraft = localStorage.getItem('rkdmc_draft');
    
    // Check current live inputs (using .trim() to ignore spaces)
    const currentEventName = document.getElementById('eventName').value.trim();
    const currentSummary = document.getElementById('summary').value.trim();
    
    const hasLiveInput = currentEventName.length > 0 || 
                         currentSummary.length > 0 ||
                         participants.length > 0;

    // Show button only if there's actual text
    if (savedDraft || hasLiveInput) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }
}

// --- LOCAL "CLOUD" SAVING (Browser Storage) ---
// Save data every time the user types
function saveProgress() {
    const fields = [
        'eventName', 'orgBody', 'eventDate', 'venue', 'yearCourse', 
        'objective', 'summary', 'achievements', 'financials', 
        'learning', 'feedback'
    ];

    let formData = {};
    let hasActualContent = false;

    // 1. Check all text fields
    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const val = element.value.trim(); 
            if (val !== "") {
                formData[id] = val;
                hasActualContent = true;
            }
        }
    });

    // 2. Check the global participants array (CRITICAL FIX)
    if (typeof participants !== 'undefined' && participants.length > 0) {
        formData.participants = participants; // Save the actual array
        hasActualContent = true;
    }

    // 3. The "Ghost Data" Purge
    if (hasActualContent) {
        localStorage.setItem('rkdmc_draft', JSON.stringify(formData));
    } else {
        localStorage.removeItem('rkdmc_draft');
    }

    toggleClearButton();
}

// Ensure button visibility is checked when page loads
window.addEventListener('load', toggleClearButton);

// Load data when page opens
window.onload = function() {
    const savedData = localStorage.getItem('rkdmc_draft');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('eventName').value = data.eventName || '';
        document.getElementById('orgBody').value = data.orgBody || '';
        document.getElementById('eventDate').value = data.eventDate || '';
        document.getElementById('venue').value = data.venue || '';
        document.getElementById('yearCourse').value = data.yearCourse || '';
        document.getElementById('objective').value = data.objective || '';
        document.getElementById('summary').value = data.summary || '';
        document.getElementById('achievements').value = data.achievements || '';
        document.getElementById('financials').value = data.financials || '';
        document.getElementById('learning').value = data.learning || '';
        document.getElementById('feedback').value = data.feedback || '';
        participants = data.participants || [];
        renderTags();
    }
};

// Add "oninput" to all your textareas and inputs in HTML to trigger saveProgress()

// --- 4. PDF GENERATION LOGIC ---
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    const bottomMargin = 275; // The "Footer" limit

    // College Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RK DAMANI MEDICAL COLLEGE", 105, y, { align: "center" });
    y += 8; 
    doc.setFontSize(10);
    doc.text("Shri RamChandra Institutes of Medical Sciences", 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(13);
    doc.text("EVENT PARTICIPATION REPORT", 105, y, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

// --- NEW SMART HELPER ---
const addSmartSection = (title, value) => {
    // 1. Handle the Rupee symbol and empty values
    let rawText = value || "Not specified";
    
    // Safety check: ensure rawText is a string before replacing
    let text = String(rawText).replace(/₹/g, "Rs."); 

    // 2. Draw Title
    if (y + 15 > bottomMargin) { 
        doc.addPage(); 
        y = 20; 
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title + ":", 20, y);
    y += 7;

    // 3. Draw Content Line-by-Line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, 170);

    lines.forEach(line => {
        if (y > bottomMargin) {
            doc.addPage();
            y = 20;
            
            // Repeat title context on new page
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text(title + " (continued...)", 20, y);
            y += 10;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
        }
        doc.text(line, 20, y);
        y += 7; // Line height
    });
    
    y += 5; // Gap after section
};

    // --- 1. BASIC DETAILS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("1. Event Details:", 20, y);
    y += 8;

    doc.setFontSize(12);
    const details = [
        { label: "Event Name:", id: 'eventName' },
        { label: "Organizing Body:", id: 'orgBody' },
        { label: "Date of Event:", id: 'eventDate' },
        { label: "Venue:", id: 'venue' },
        { label: "Year/Course:", id: 'yearCourse' }
    ];

    details.forEach(item => {
        const val = document.getElementById(item.id).value || "N/A";
        doc.setFont("helvetica", "bold");
        doc.text(item.label, 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(val, 65, y);
        y += 8;
    });
    y += 5;

    // --- 2. PARTICIPANTS & CONTENT ---
    addSmartSection("2. Names of Participants", participants.length > 0 ? participants.join(", ") : "None listed");
    addSmartSection("3. Objective of Participation", document.getElementById('objective').value);
    addSmartSection("4. Summary of Activities", document.getElementById('summary').value);
    addSmartSection("5. Achievements/Outcomes", document.getElementById('achievements').value);
    addSmartSection("6. Financial Details", document.getElementById('financials').value);
    addSmartSection("7. Overall Experience & Learning", document.getElementById('learning').value);
    addSmartSection("8. Suggestions/Feedback", document.getElementById('feedback').value);
    
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
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("", 105, 288, { align: "center" });
    }

    doc.save(`RKDMC_Report_${document.getElementById('eventName').value || 'Event'}.pdf`);
}