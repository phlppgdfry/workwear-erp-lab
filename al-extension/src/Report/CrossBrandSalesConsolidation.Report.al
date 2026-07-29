report 50100 "Cross-Brand Sales Consolidation"
{
    // Consolidates posted sales invoice totals per brand company, without
    // merging companies. Each brand keeps its own BC company (own G/L,
    // own item/customer masters); this report crosses that boundary read-only
    // via ChangeCompany, which is the pattern Business Central uses for
    // read access into another company from AL.
    UsageCategory = ReportsAndAnalysis;
    ApplicationArea = All;
    Caption = 'Cross-Brand Sales Consolidation';
    ProcessingOnly = true;

    dataset
    {
        dataitem(BrandSetup; "Brand Company Setup")
        {
            RequestFilterFields = "Brand Code";

            trigger OnAfterGetRecord()
            var
                SalesInvHeader: Record "Sales Invoice Header";
                BrandSalesBuffer: Record "Brand Sales Buffer" temporary;
                InvoiceCount: Integer;
                TotalAmount: Decimal;
            begin
                if not BrandSetup.Active then
                    CurrReport.Skip();

                SalesInvHeader.ChangeCompany(BrandSetup."Company Name");
                if PeriodStartDate <> 0D then
                    SalesInvHeader.SetRange("Posting Date", PeriodStartDate, PeriodEndDate);

                if SalesInvHeader.FindSet() then
                    repeat
                        InvoiceCount += 1;
                        TotalAmount += SalesInvHeader."Amount Including VAT";
                    until SalesInvHeader.Next() = 0;

                BrandSalesBuffer.Init();
                BrandSalesBuffer."Brand Code" := BrandSetup."Brand Code";
                BrandSalesBuffer."Company Name" := BrandSetup."Company Name";
                BrandSalesBuffer."Posted Invoice Count" := InvoiceCount;
                BrandSalesBuffer."Total Sales Amount" := TotalAmount;
                BrandSalesBuffer.Insert();

                ResultBuffer.Copy(BrandSalesBuffer, true);
                if ResultBuffer.Insert() then;
            end;
        }
    }

    requestpage
    {
        layout
        {
            area(Content)
            {
                group(Options)
                {
                    field(PeriodStart; PeriodStartDate)
                    {
                        ApplicationArea = All;
                        Caption = 'From Posting Date';
                    }
                    field(PeriodEnd; PeriodEndDate)
                    {
                        ApplicationArea = All;
                        Caption = 'To Posting Date';
                    }
                }
            }
        }
    }

    var
        ResultBuffer: Record "Brand Sales Buffer" temporary;
        PeriodStartDate: Date;
        PeriodEndDate: Date;

    trigger OnPostReport()
    var
        BrandSalesOverview: Page "Brand Sales Overview";
    begin
        BrandSalesOverview.SetRecords(ResultBuffer);
        BrandSalesOverview.RunModal();
    end;
}
