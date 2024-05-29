// import localforage from 'localforage';

const workerFunction = function () {
   self.onmessage = async (event: MessageEvent) => {
      console.log("WORKER", event.data);

      const localforage = indexedDB.open("salina", 1);

      localforage.onupgradeneeded = () => {
        const objectStore = localforage.result.createObjectStore("local");
        objectStore.createIndex("name", "name", { unique: false });

        
      }

    //   localforage.onsuccess = () => {
    //     const db = localforage.result;

    //     const result = db.transaction("files", "readwrite").objectStore("files").getAll("files");

    //     console.log("DB WORKER: ", result);
    //   }

      postMessage('Message has been gotten!');
   };
};

let codeToString = workerFunction.toString();
let mainCode = codeToString.substring(codeToString.indexOf('{') + 1, codeToString.lastIndexOf('}'));
let blob = new Blob([mainCode], { type: 'application/javascript' });
let worker_script = URL.createObjectURL(blob);

export default worker_script;