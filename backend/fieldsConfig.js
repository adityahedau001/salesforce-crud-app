// Curated field lists per standard object.
// Kept between 5 and 10 fields as required by the assignment, and chosen
// from fields that exist on every fresh Developer Edition org by default.

module.exports = {
  Account: {
    fields: ["Name", "Industry", "Phone", "Website", "BillingCity", "BillingState", "AnnualRevenue", "NumberOfEmployees"],
    displayField: "Name",
    orderBy: "Name",
  },
  Opportunity: {
    fields: ["Name", "StageName", "Amount", "CloseDate", "Probability", "Type", "LeadSource"],
    displayField: "Name",
    orderBy: "CloseDate DESC",
  },
  Lead: {
    fields: ["FirstName", "LastName", "Company", "Email", "Phone", "Status", "LeadSource"],
    displayField: "LastName",
    orderBy: "LastName",
  },
  Contact: {
    fields: ["FirstName", "LastName", "Email", "Phone", "Title", "Department", "MailingCity"],
    displayField: "LastName",
    orderBy: "LastName",
  },
  Case: {
    fields: ["Subject", "Status", "Priority", "Origin", "Type", "Description"],
    displayField: "Subject",
    orderBy: "CreatedDate DESC",
  },
};
