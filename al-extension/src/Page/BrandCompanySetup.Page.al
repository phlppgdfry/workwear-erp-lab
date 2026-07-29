page 50102 "Brand Company Setup"
{
    PageType = List;
    SourceTable = "Brand Company Setup";
    Caption = 'Brand Company Setup';
    UsageCategory = Administration;
    ApplicationArea = All;
    Editable = true;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field("Brand Code"; Rec."Brand Code") { ApplicationArea = All; }
                field("Company Name"; Rec."Company Name") { ApplicationArea = All; }
                field("Acquired On"; Rec."Acquired On") { ApplicationArea = All; }
                field(Active; Rec.Active) { ApplicationArea = All; }
            }
        }
    }
}
