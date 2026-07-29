table 50103 "Brand Sales Buffer"
{
    Caption = 'Brand Sales Buffer';
    DataClassification = SystemMetadata;
    TableType = Temporary;

    fields
    {
        field(1; "Brand Code"; Code[20]) { Caption = 'Brand Code'; }
        field(2; "Company Name"; Text[30]) { Caption = 'Company'; }
        field(3; "Posted Invoice Count"; Integer) { Caption = 'Posted Invoices'; }
        field(4; "Total Sales Amount"; Decimal) { Caption = 'Total Sales (LCY)'; AutoFormatType = 1; }
    }

    keys
    {
        key(PK; "Brand Code")
        {
            Clustered = true;
        }
    }
}
