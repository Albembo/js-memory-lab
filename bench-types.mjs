import { run, bench, group } from 'mitata';

async function main() {
    const SIZE = 10_000; // Teniamolo più basso per evidenziare il costo di accesso

    // SETUP DATI PER IL TEST DEGLI OGGETTI
    // 1. Monomorphic: Tutti uguali, creati nello stesso ordine
    const monoArray = [];
    for (let i = 0; i < SIZE; i++) {
        monoArray.push({ a: i, b: i * 2 });
    }

    // 2. Polymorphic: Stessi dati, ma ordine di creazione diverso
    const polyArray = [];
    for (let i = 0; i < SIZE; i++) {
        if (i % 2 === 0) {
            polyArray.push({ a: i, b: i * 2 }); // Shape A
        } else {
            polyArray.push({ b: i * 2, a: i }); // Shape B
        }
    }

    group('Part 1: Array Element Kinds (Il costo del "tipo sporco")', () => {

        // Caso A: Array di soli Interi (SMI)
        const arrSmi = new Array(SIZE).fill(0).map((_, i) => i);

        // Caso B: Array di Interi + 1 Double (Forza la conversione a Double)
        const arrDouble = new Array(SIZE).fill(0).map((_, i) => i);
        arrDouble[SIZE - 1] = 0.5; // <--- Il guastafeste

        // Caso C: Array di Interi + 1 Stringa (Forza la conversione a Object generico)
        const arrTagged = new Array(SIZE).fill(0).map((_, i) => i);
        arrTagged[SIZE - 1] = "Sono lento"; // <--- Il disastro

        bench('Read Packed SMI (Solo Interi)', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) sum += arrSmi[i]; // Lettura veloce
            return sum;
        });

        bench('Read Packed DOUBLE (Con 1 decimale)', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) sum += arrDouble[i]; // Lettura leggermente più lenta
            return sum;
        });

        bench('Read Packed ELEMENTS (Con 1 stringa)', () => {
            let sum = 0;
            // Qui V8 deve fare un check di tipo su OGNI elemento
            for (let i = 0; i < SIZE; i++) {
                // forziamo un'operazione matematica per vedere il costo del type check
                const val = typeof arrTagged[i] === 'number' ? arrTagged[i] : 0;
                sum += val;
            }
            return sum;
        });
    });

    group('Part 2: Object Shapes (Monomorphic vs Polymorphic)', () => {

        bench('Lettura Monomorphic {a, b}', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) {
                sum += monoArray[i].a; // Accesso diretto (Offset fisso)
            }
            return sum;
        });

        bench('Lettura Polymorphic {a, b} vs {b, a}', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) {
                sum += polyArray[i].a; // V8 deve indovinare la Shape ogni volta
            }
            return sum;
        });

    });

    await run();
}

main();