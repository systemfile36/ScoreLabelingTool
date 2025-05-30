let datasetDir = "";
let dbPath = "";
let dbTableName = "";

let currentRow = null;
let currentRowIndex = -1;

let currentPageData = [];

let currentPage = 0;
const pageSize = 100;
let totalRowCount = -1;

const DATASET_DIR_KEY = "datasetDir";
const DB_PATH_KEY = "dbPath";
const DB_TABLE_NAME_KEY = "dbTableName"
const PAGE_KEY = "page";
const PAGE_SIZE_KEY = "pageSize";

let isInit = false;

async function init() {
    //Get from localStorage
    datasetDir = localStorage.getItem(DATASET_DIR_KEY);
    dbPath = localStorage.getItem(DB_PATH_KEY);
    dbTableName = localStorage.getItem(DB_TABLE_NAME_KEY);

    currentPage = localStorage.getItem(PAGE_KEY);

    document.querySelector("#datasetDir").value = datasetDir;
    document.querySelector("#dbPath").value = dbPath;
    document.querySelector("#dbTableName").value = dbTableName;

    isInit = true;
}

async function loadData() {

    if(!isInit) init();

    //null check
    datasetDir = document.querySelector("#datasetDir").value;
    dbPath = document.querySelector("#dbPath").value;
    dbTableName = document.querySelector("#dbTableName").value;

    //null check
    if(!(datasetDir && dbPath && dbTableName)) return;

    console.log(`load ${currentPage} page`)

    const res = await fetch("/load-db", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    // '{ "datasetDir": "......", "dbPath": "......", "dbTableName": "......", "page": ..., "limit": ... }'
    body: JSON.stringify({ dbPath, dbTableName, page: currentPage, limit: pageSize })
    });

    try {
        // Desctructuring
        const { rows, total } = await res.json();
        currentPageData = rows;
        totalRowCount = total;

        //Update localStorage
        localStorage.setItem(DATASET_DIR_KEY, datasetDir);
        localStorage.setItem(DB_PATH_KEY, dbPath);
        localStorage.setItem(DB_TABLE_NAME_KEY, dbTableName);
        localStorage.setItem(PAGE_KEY, currentPage);

        renderTable(rows);
    }
    catch(err) {
        console.log(err);
    }
}

function renderTable() {
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (currentPageData.length === 0) return;

    const columns = Object.keys(currentPageData[0]);
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    currentPageData.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.onclick = () => {
        selectRow(row);
    };
    columns.forEach(col => {
        const td = document.createElement("td");
        td.textContent = row[col];
        tr.appendChild(td);
    });
    tableBody.appendChild(tr);
    });

    document.getElementById("pageInfo").textContent = `Page ${currentPage + 1} / ${Math.ceil(totalRowCount / pageSize)}`;
}

async function nextPage() {
    if ((currentPage + 1) * pageSize < totalRowCount) {
        currentPage++;
        console.log(`currentPage ${currentPage}`);
        await loadData();
    }
}

async function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        await loadData();
    }
}

function selectRow(row) {
    currentRow = row;
    const filePath = `${datasetDir}/${row.filename.substring(0, 2)}/${row.filename}.png`;
    document.getElementById("previewImage").src = `/get-image?path=${encodeURIComponent(filePath)}`;

    const form = document.getElementById("editForm");
    form.innerHTML = "";
    const keys = Object.keys(row);

    keys.forEach((key, index) => {
    const label = document.createElement("label");
    label.textContent = key;
    const input = document.createElement("input");
    input.name = key;
    input.value = row[key];
    input.setAttribute("tabindex", index + 1);
    form.appendChild(label);
    form.appendChild(input);
    });

    const applyButton = document.getElementById("applyButton");
    applyButton.setAttribute("tabindex", keys.length + 1);

    form.onkeydown = (e) => {
    if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentRowIndex > 0) {
        currentRowIndex--;
        selectRow(currentPageData[currentRowIndex]);
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentRowIndex < currentPageData.length - 1) {
        currentRowIndex++;
        selectRow(currentPageData[currentRowIndex]);
        }
    }
    };

    const firstInput = form.querySelector("input");
    if (firstInput) firstInput.focus();
}

async function applyChanges() {
    const form = document.getElementById("editForm");
    const formData = new FormData(form);
    const updatedRow = {};
    formData.forEach((value, key) => updatedRow[key] = value);

    await fetch("/update-row", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        dbPath,
        row: updatedRow, 
        dbTableName
    })
    });

    alert("Saved!");
    loadData();
}

function test() {
    console.log("test");
}