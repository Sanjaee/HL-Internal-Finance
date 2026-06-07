import { getCustomers } from "@/actions/customer-actions";
import { CustomerClient } from "./customer-client";

export default async function CustomersPage() {
  const res = await getCustomers();
  const customers = res.success && res.data ? res.data : [];

  return <CustomerClient customers={customers} />;
}
