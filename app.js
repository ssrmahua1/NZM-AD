// Chandu Sanitation Pay & Use Toilet AD Bill Manager (Light White Portal Controller)

// App State for fallback browser session uploads
let uploadedFiles = {};
let selectedBill = null;

// DOM Elements
const filterYear = document.getElementById('filterYear');
const filterMonth = document.getElementById('filterMonth');
const filterType = document.getElementById('filterType');

const outputHeader = document.getElementById('outputHeader');
const outputTitle = document.getElementById('outputTitle');
const downloadBtn = document.getElementById('downloadBtn');
const previewPane = document.getElementById('previewPane');

const folderInput = document.getElementById('folderInput');
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');

const toast = document.getElementById('toast');

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  { val: 'Jan', name: 'January / जनवरी' },
  { val: 'Feb', name: 'February / फ़रवरी' },
  { val: 'Mar', name: 'March / मार्च' },
  { val: 'Apr', name: 'April / अप्रैल' },
  { val: 'May', name: 'May / मई' },
  { val: 'Jun', name: 'June / जून' },
  { val: 'Jul', name: 'July / जुलाई' },
  { val: 'Aug', name: 'August / अगस्त' },
  { val: 'Sep', name: 'September / सितम्बर' },
  { val: 'Oct', name: 'October / अक्टूबर' },
  { val: 'Nov', name: 'November / नवम्बर' },
  { val: 'Dec', name: 'December / दिसम्बर' }
];

// Initial Setup
function init() {
  setupEventListeners();
  populateDropdowns();
}

// Show Toast
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Populate Dropdowns dynamically (from December 2025 to current month + 1 month extra)
function populateDropdowns() {
  const currentDate = new Date();
  // Shift date by +1 month to implement "1 month extra" request
  currentDate.setMonth(currentDate.getMonth() + 1);

  const maxYear = currentDate.getFullYear(); // e.g. 2026 (or 2027 if current was Dec 2026)
  const maxMonthIdx = currentDate.getMonth(); // e.g. 7 (August) since current local is July

  // Populate Years dropdown: starts from 2025 up to maxYear
  let yearHtml = '';
  for (let y = 2025; y <= maxYear; y++) {
    yearHtml += `<option value="${y}" ${y === maxYear ? 'selected' : ''}>${y}</option>`;
  }
  filterYear.innerHTML = yearHtml;

  // Helper function to update month options depending on selected year
  function updateMonths() {
    const selectedYear = parseInt(filterYear.value);
    let startIdx = 0;
    let endIdx = 11;

    if (selectedYear === 2025) {
      startIdx = 11; // Only December 2025
      endIdx = 11;
    } else if (selectedYear === maxYear) {
      startIdx = 0;
      endIdx = maxMonthIdx; // Up to max month (current month + 1 extra, i.e., August)
    }

    let monthHtml = '';
    for (let i = startIdx; i <= endIdx; i++) {
      // Default select logic:
      // - Dec if year is 2025
      // - Max month (August) if selected year is maxYear
      // - Jan otherwise
      const isSelected = (selectedYear === maxYear && i === maxMonthIdx) || 
                          (selectedYear === 2025 && i === 11) || 
                          (selectedYear !== 2025 && selectedYear !== maxYear && i === 0);
                          
      monthHtml += `<option value="${MONTHS_SHORT[i]}" ${isSelected ? 'selected' : ''}>${MONTHS_FULL[i].name}</option>`;
    }
    filterMonth.innerHTML = monthHtml;
  }

  // Bind update function on year change
  filterYear.addEventListener('change', updateMonths);
  
  // Initialize month select
  updateMonths();
}

// Setup Event listeners
function setupEventListeners() {
  // Backup file scanner events
  if (dropzone) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadCurrentBill);
  }
}

// Backup session parser
function handleFiles(filesList) {
  let count = 0;
  for (let i = 0; i < filesList.length; i++) {
    const file = filesList[i];
    if (file.name.endsWith('.pdf')) {
      const metadata = parseFilename(file.name);
      if (metadata) {
        const key = `${metadata.type}_${metadata.year}_${metadata.month}`;
        uploadedFiles[key] = {
          fileObj: file,
          name: file.name
        };
        count++;
      }
    }
  }
  if (count > 0) {
    showToast(`Loaded ${count} PDFs in browser session`);
  } else {
    showToast(`No matching PDFs found in upload.`);
  }
}

function parseFilename(name) {
  const cleanName = name.toLowerCase();
  
  let type = 'rent';
  if (cleanName.includes('ele') || cleanName.includes('elect') || cleanName.includes('recharge')) {
    type = 'ele';
  }

  let month = null;
  for (const m of MONTHS_SHORT) {
    if (cleanName.includes(m.toLowerCase())) {
      month = m;
      break;
    }
  }

  let year = null;
  const yearMatch = cleanName.match(/\b(202\d|2\d)\b/);
  if (yearMatch) {
    const yStr = yearMatch[1];
    year = yStr.length === 2 ? parseInt('20' + yStr) : parseInt(yStr);
  }

  if (month && year) {
    return { type, month, year };
  }
  return null;
}

// Get file properties
function getExpectedFileDetails(year, month, type) {
  const shortYear = year.slice(-2);
  if (type === 'rent') {
    return {
      folder: 'Rent',
      filename: `NZM AD Bill ${month}-${year}.pdf`,
      path: `Rent/NZM AD Bill ${month}-${year}.pdf`
    };
  } else {
    return {
      folder: 'Electric Bill',
      filename: `Nizamuddin AD ELE ${month}-${shortYear} recharge.pdf`,
      path: `Electric Bill/Nizamuddin AD ELE ${month}-${shortYear} recharge.pdf`
    };
  }
}

// Check if file exists via fetch request
async function checkFileExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Primary generate/submit action
async function handleGenerate() {
  const year = filterYear.value;
  const month = filterMonth.value;
  const type = filterType.value;
  
  previewPane.innerHTML = `
    <div class="preview-placeholder">
      <div style="width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
      <p>Searching file in directory...</p>
    </div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;
  
  const fileDetails = getExpectedFileDetails(year, month, type);
  const key = `${type}_${year}_${month}`;

  let exists = await checkFileExists(fileDetails.path);
  let fileObj = null;
  let source = exists ? 'local' : null;

  // Fallback to browser session upload
  if (!exists && uploadedFiles[key]) {
    exists = true;
    source = 'session';
    fileObj = uploadedFiles[key].fileObj;
  }

  if (exists) {
    // Show PDF
    const fileUrl = source === 'session' ? URL.createObjectURL(fileObj) : fileDetails.path;
    selectedBill = {
      exists: true,
      source: source,
      filePath: fileDetails.path,
      filename: fileDetails.filename,
      fileObj: fileObj
    };

    previewPane.innerHTML = `
      <iframe class="pdf-viewer-frame" src="${fileUrl}#toolbar=0" title="PDF Preview">
        <object data="${fileUrl}" type="application/pdf" width="100%" height="540px">
          <p>Your browser doesn't support PDF viewing. <a href="${fileUrl}" target="_blank">Click here to open the PDF</a></p>
        </object>
      </iframe>
    `;

    const typeLabel = type === 'rent' ? 'Ad Rent' : 'Ad Electricity';
    outputTitle.textContent = `${typeLabel} Bill (${month}-${year})`;
    outputHeader.style.display = 'flex';
    downloadBtn.style.display = 'inline-flex';
    showToast("PDF found! Opening preview...");
  } else {
    // Show Simplified File Not Found screen
    selectedBill = null;
    outputHeader.style.display = 'none';
    downloadBtn.style.display = 'none';

    previewPane.innerHTML = `
      <div class="not-found-simple">
        <div class="not-found-icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <line x1="9" x2="15" y1="9" y2="15"/>
            <line x1="15" x2="9" y1="9" y2="15"/>
          </svg>
        </div>
        <div class="not-found-title-simple">File Not Found / फ़ाइल नहीं मिली</div>
        <p class="not-found-desc-simple">
          इस बिल की PDF फ़ाइल डायरेक्टरी में नहीं मिली। कृपया सुनिश्चित करें कि फ़ाइल सही फोल्डर में मौजूद है।
        </p>
      </div>
    `;
    showToast("File not found.");
  }
}

// Download PDF Action
function downloadCurrentBill() {
  if (!selectedBill || !selectedBill.exists) return;

  if (selectedBill.source === 'session') {
    const url = URL.createObjectURL(selectedBill.fileObj);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedBill.fileObj.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    const a = document.createElement('a');
    a.href = selectedBill.filePath;
    a.download = selectedBill.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// Export functions to window
window.handleGenerate = handleGenerate;

// Run app init
document.addEventListener('DOMContentLoaded', init);
