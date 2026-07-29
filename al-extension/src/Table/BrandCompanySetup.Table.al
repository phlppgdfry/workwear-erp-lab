table 50102 "Brand Company Setup"
{
    Caption = 'Brand Company Setup';
    DataClassification = CustomerContent;
    LookupPageId = "Brand Company Setup";

    fields
    {
        field(1; "Brand Code"; Code[20])
        {
            Caption = 'Brand Code';
            DataClassification = CustomerContent;
        }
        field(2; "Company Name"; Text[30])
        {
            Caption = 'Company Name';
            DataClassification = CustomerContent;
            TableRelation = Company.Name;
        }
        field(3; "Acquired On"; Date)
        {
            Caption = 'Acquired On';
            DataClassification = CustomerContent;
        }
        field(4; Active; Boolean)
        {
            Caption = 'Active';
            DataClassification = CustomerContent;
            InitValue = true;
        }
    }

    keys
    {
        key(PK; "Brand Code")
        {
            Clustered = true;
        }
    }
}
