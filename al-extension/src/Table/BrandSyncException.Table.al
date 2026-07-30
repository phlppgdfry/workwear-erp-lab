table 50101 "Brand Sync Exception"
{
    Caption = 'Brand Sync Exception';
    DataClassification = CustomerContent;
    LookupPageId = "Brand Sync Exceptions";
    DrillDownPageId = "Brand Sync Exceptions";

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            AutoIncrement = true;
            DataClassification = SystemMetadata;
        }
        field(2; "Brand Code"; Code[20])
        {
            Caption = 'Brand Code';
            DataClassification = CustomerContent;
        }
        field(3; "Source System"; Text[30])
        {
            Caption = 'Source System';
            DataClassification = CustomerContent;
        }
        field(4; "Order Reference"; Text[50])
        {
            Caption = 'Order Reference';
            DataClassification = CustomerContent;
        }
        field(5; "Error Message"; Text[250])
        {
            Caption = 'Error Message';
            DataClassification = CustomerContent;
        }
        field(6; "Occurred At"; DateTime)
        {
            Caption = 'Occurred At';
            DataClassification = CustomerContent;
        }
        field(7; Resolved; Boolean)
        {
            Caption = 'Resolved';
            DataClassification = CustomerContent;
        }
        field(8; "Resolved At"; DateTime)
        {
            Caption = 'Resolved At';
            DataClassification = CustomerContent;
        }
        field(9; "Integration Key"; Text[100])
        {
            Caption = 'Integration Key';
            DataClassification = CustomerContent;
        }
        field(10; "Error Category"; Option)
        {
            Caption = 'Error Category';
            OptionMembers = Validation,Transient,Permanent;
            DataClassification = CustomerContent;
        }
        field(11; "Retry Count"; Integer)
        {
            Caption = 'Retry Count';
            DataClassification = CustomerContent;
        }
        field(12; "Processing Status"; Option)
        {
            Caption = 'Processing Status';
            OptionMembers = Received,RetryScheduled,DeadLetter,Completed;
            DataClassification = CustomerContent;
        }
        field(13; "Reprocess Requested"; Boolean)
        {
            Caption = 'Reprocess Requested';
            DataClassification = CustomerContent;
        }
    }

    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
        key(ByStatus; Resolved, "Occurred At") { }
        key(ByIntegrationKey; "Integration Key") { }
    }

    trigger OnModify()
    begin
        if Resolved and (Rec."Resolved At" = 0DT) then
            Rec."Resolved At" := CurrentDateTime;
    end;
}
