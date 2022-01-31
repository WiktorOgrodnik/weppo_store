import { rebuiltDatabase, add } from "../../dbconnect.js";

const initialData = {
    
    statuses: [
        ['Koszyk'],
        ['Oczekiwanie na płatność'],
        ['Przygotowywanie'],
        ['Pakowanie'],
        ['Oczekiwanie na odbiór'],
        ['Wysłano'],
        ['Gotowe do odbioru'],
        ['Odebrano'],
        ['Anulowano']
    ],
    categories: [
        ['Laptopy i Komputery'],
        ['Smartfony'],
        ['Podzespoły komputerowe'],
        ['Urządzenia peryferyjne'],
        ['RTV'],
        ['Smarthome'],
        ['Akcesoria']
    ],
    products: [
        ['ASUS TUF Gaming F15', 489900, 489900, 76, 'Stworzony pod kątem poważnej rozgrywki i zapewnienia wysokiej wytrzymałości w codziennym użytkowaniu laptop TUF Gaming F15 to doskonale wyposażona maszyna gamingowa, która będzie towarzyszyła Ci podczas kolejnych zwycięstw. Dzięki zastosowaniu procesora Intel® Core™ 11. generacji i karty graficznej GeForce® RTX z serii 3000 — nawet najszybsza akcja rozgrywki będzie dynamiczna i płynna.', 'lap1.jpg'],
        ['Samsung Galaxy S21 FE 5G', 349900, 349900, 1, 'Popatrz jak wygląda nowy Samsung Galaxy S21 FE 128 GB 5G Fan Edition szary, Jego konstrukcja nawiązuje do rodziny S21. Obudowa jest elegancka, a zarazem minimalistyczna. Dzięki temu jest po prostu piękna. W jej konstrukcji znalazło się miejsce na trzy aparaty, które zagwarantują doskonałe ujęcia. Potem możesz je wyświetlić na ekran o wielkości 6,4 cala. Ma on rozdzielczość Full HD+, więc każde treści już stale będą pełne detali i szczegółów. To wszystko dopełnia procesor z ośmioma rdzeniami. Jest to Snapdragon 888. Korzystaj o resztę zadba S21 FE 5G Fan Edition.', 'samsung.jpg'],
        ['Nokia C20 Dual SIM', 39900, 39900, 23, 'Skandynawski design i jakość wykonania oznaczają, że Nokia C20 niebieski nie tylko świetnie wygląda, ale jest również wytrzymała. Bateria działa przez cały dzień i pozwoli robić Ci to, co lubisz, bez obaw o zapas energii. Duży ekran sprawia, że ​​wszystko wygląda jeszcze lepiej. Smartfon działa na szybkim procesorze z systemem Android 11 oraz łącznością 4G. Dzięki regularnym aktualizacjom Nokia C20 będzie działać płynniej i dłużej.', 'nokia.jpg']
    ],
    categories_products: [
        [1, 1],
        [2, 2],
        [3, 2]
    ],
    tags: [
        ['telefony']
    ],
    tags_products: [
        [2, 1],
        [3, 1]
    ],
    deliveries: [
        ['Kurier - InPost, UPS, FedEx, DTS', 2000],
        ['Paczkomaty 24/7', 900],
        ['Punkt odbioru - Poczta Polska, Żabka', 890]
    ],
    payment_methods: [
        ['BLIK', 0],
        ['Karta płatnicza online', 0],
        ['Płatność online', 3089],
        ['Przelew gotówkowy', 0],
        ['Przy odbiorze', 500],
        ['Raty', 0],
        ['Leasing', 0]
    ],
    roles: [
        ['Niezalogowany'],
        ['Klient'],
        ['Administrator']
    ]
};

(async () => {
    await rebuiltDatabase();

    for (let i in initialData) {
        const callback = add(i);
        for (let j of initialData[i]) await callback(j);
    }

})();

console.log('rebuilding database...');