import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import EditClientForm from '@/components/private/EditClientForm';
import { getCurrentUser } from '@/lib/server-auth';

async function getClient(id: string, userId: string) {
  try {
    const result = await query(
      // Asegurarse de que el cliente pertenece al usuario que hace la solicitud
      'SELECT * FROM clientes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  if (!user) {
    // O redirigir a login
    return notFound();
  }

  const client = await getClient(params.id, user.id);

  if (!client) {
    return notFound();
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Editar Cliente</h1>
      <EditClientForm client={client} />
    </div>
  );
}
