# Walkthrough: Tycoon-Tempo, Bemandingssystem & Passager-Info

Vi har tilpasset Metrosimulatorens tempo, så spillet nu er et strategisk tycoon-spil (SimCity/Railway Tycoon stil) frem for et hektisk klikkerspil. Dette er opnået ved at reducere uventede nedbrud og introducere strategiske styringsværktøjer som Metro Stewards og passagerinformation.

## Gennemførte Forbedringer

### 1. Tycoon-Tempo & Langsomme Fejl
*   **Reduceret fejlfrekvens:** Sandsynligheden for tilfældige fejl og hændelser er reduceret med 80% (5 gange mere sjældne).
*   **Langsommere vækst:** Det tager nu ca. 100 sekunder (4x langsommere end før) for en anomali at udvikle sig to et kritisk driftsstop. Dette giver spilleren rigelig tid til at opdage fejlen i DATA-dashboardet og planlægge nødvedligeholdelse i tide.

### 2. Metro Stewards Bemandingssystem (Personale)
*   **Hyr & Uddan Personale:** I shoppen kan du hyre flere Metro Stewards ($1.000) og opgradere deres certificeringsniveau ($2.500) op til niveau 3. Højere uddannelsesniveau reducerer deres rejsetid (fra 10s til 4s) og reparationstid (fra 6s til 2s).
*   **Realtidsstyring under nedbrud:** Når et tog bryder sammen, skal en ledig steward sendes afsted i DATA-dashboardet eller på tog-detaljekortet. Toget holder stille, mens en steward rejser dertil (vises som realtidsnedtælling `Rejser dertil: ~X.Xs`) og udbedrer fejlen (`Udbedrer fejl: ~X.Xs`).
*   **Løbende lønninger:** Hver steward modtager en løbende løn (ca. $50/min pr. steward), som trækkes løbende fra driftsbudgettet.

### 3. Passagerinformationssystem (PIDS)
Under et nedbrud falder passagerernes tilfredshed hurtigt. Du kan dæmpe dette markant ved at informere dem:
*   **Manuel information:** Du kan udsende et højtalerudkald i kontrolrummet for $50. Dette reducerer tilfredshedsfaldet med 75% i 15 sekunder. En aktiv status vises med en blinkende badge og en realtidsnedtælling.
*   **Automatiseret PIDS:** Du kan købe "Automatiseret PIDS" i shoppen til $2.000. Dette reducerer passagerernes vrede permanent under alle forsinkelser med 50%.
*   **Steward-nærvær:** Hvis en steward arbejder lokalt på et nedbrudt tog, reduceres passagerernes utilfredshed yderligere med 20%.

---

## Verifikationsstatus

*   **TypeScript Byg:** Bygget med succes (`npm run build`) uden fejl.
*   **Personale & Info Panel:** Fuldt integreret i kontrolrummet med live visning af ledige stewards, uddannelsesniveau, samt mulighed for at udsende højtalerinfo manuelt.
*   **Steward Travel/Repair Progress:** Realtidsnedtællinger for rejse- og reparationstid vises nu live i både DATA-dashboardet under Gold Layer samt på tog-detaljekortet, når en steward er udsendt.
