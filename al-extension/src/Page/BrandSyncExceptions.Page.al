page 50101 "Brand Sync Exceptions"
{
    PageType = List;
    SourceTable = "Brand Sync Exception";
    Caption = 'Brand Sync Exceptions';
    UsageCategory = Lists;
    ApplicationArea = All;
    CardPageId = "Brand Sync Exceptions";
    Editable = true;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field("Entry No."; Rec."Entry No.") { ApplicationArea = All; }
                field("Brand Code"; Rec."Brand Code") { ApplicationArea = All; }
                field("Source System"; Rec."Source System") { ApplicationArea = All; }
                field("Order Reference"; Rec."Order Reference") { ApplicationArea = All; }
                field("Error Message"; Rec."Error Message") { ApplicationArea = All; }
                field("Error Category"; Rec."Error Category") { ApplicationArea = All; }
                field("Processing Status"; Rec."Processing Status") { ApplicationArea = All; }
                field("Retry Count"; Rec."Retry Count") { ApplicationArea = All; }
                field("Integration Key"; Rec."Integration Key") { ApplicationArea = All; }
                field("Reprocess Requested"; Rec."Reprocess Requested") { ApplicationArea = All; }
                field("Occurred At"; Rec."Occurred At") { ApplicationArea = All; }
                field(Resolved; Rec.Resolved) { ApplicationArea = All; }
                field("Resolved At"; Rec."Resolved At") { ApplicationArea = All; }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(MarkResolved)
            {
                ApplicationArea = All;
                Caption = 'Mark Resolved';
                Image = Approve;
                trigger OnAction()
                begin
                    Rec.Resolved := true;
                    Rec.Modify(true);
                end;
            }
            action(RequestReprocess)
            {
                ApplicationArea = All;
                Caption = 'Request Reprocess';
                Image = ReOpen;
                trigger OnAction()
                begin
                    Rec."Reprocess Requested" := true;
                    Rec.Resolved := false;
                    Rec.Modify(true);
                end;
            }
        }
    }
}
