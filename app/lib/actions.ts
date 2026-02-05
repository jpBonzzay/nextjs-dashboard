"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// ✅ Schema base (como está en BD)
const InvoiceBaseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid("Must be a valid customer ID"),
  amount: z.coerce
    .number()
    .gt(0, "Amount must be greater than 0")
    .finite("Amount must be a valid number")
    .multipleOf(0.01, "Max 2 decimal places"),
  status: z.enum(["pending", "paid"]),
  date: z.string().date(),
});

// ✅ Para CREAR (sin id ni date - se generan)
const CreateInvoiceSchema = InvoiceBaseSchema.omit({
  id: true,
  date: true,
});

// ✅ Para ACTUALIZAR (sin id ni date - no cambian)
const UpdateInvoiceSchema = InvoiceBaseSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoiceSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
  } catch (error) {
    throw new Error("Failed to create invoice");
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoiceSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = Math.round(amount * 100);

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
  } catch (error) {
    throw new Error("Failed to update invoice");
  }
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}
