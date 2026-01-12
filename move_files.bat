@echo off
set "SRC=..\Architecting GearBox ERP for NZ SaaS FinTech Market"

md src\pages
md src\components
md src\contexts
md src\components\ui
md src\lib

echo Moving Pages...
copy "%SRC%\Home.tsx" src\pages\
copy "%SRC%\SetupLedger.tsx" src\pages\
copy "%SRC%\TradesDashboard.tsx" src\pages\
copy "%SRC%\NewJob.tsx" src\pages\
copy "%SRC%\JobDetail.tsx" src\pages\
copy "%SRC%\GenerateInvoice.tsx" src\pages\
copy "%SRC%\Vehicles.tsx" src\pages\
copy "%SRC%\AddVehicle.tsx" src\pages\
copy "%SRC%\BookingCalendar.tsx" src\pages\
copy "%SRC%\QuoteDetail.tsx" src\pages\
copy "%SRC%\DVIInspection.tsx" src\pages\
copy "%SRC%\Customers.tsx" src\pages\
copy "%SRC%\Reports.tsx" src\pages\
copy "%SRC%\Settings.tsx" src\pages\

echo Moving Components...
copy "%SRC%\Navigation.tsx" src\components\
copy "%SRC%\LedgerSwitcher.tsx" src\components\
copy "%SRC%\ProfitSpeedometer.tsx" src\components\

echo Moving Contexts...
copy "%SRC%\LedgerContext.tsx" src\contexts\

echo Moving Logic...
copy "%SRC%\pdfGenerator.ts" src\server\
copy "%SRC%\App.tsx" src\

echo Moving Assets...
copy "%SRC%\index.css" src\
copy "%SRC%\index.html" .\

echo Done.
