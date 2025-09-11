'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_super_admin: boolean;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
}

interface UserPermission {
  id: string;
  permission_key: string;
  granted: boolean;
  scope: any;
  created_at: string;
}

interface UserRole {
  role_id: string;
  name: string;
  display_name: string;
  description: string;
}

interface UserPermissionsData {
  userId: string;
  directPermissions: UserPermission[];
  roles: UserRole[];
  count: number;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [newPermission, setNewPermission] = useState({
    permissionKey: '',
    scope: ''
  });
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // NUEVO: estado para crear/editar usuario y modales/acciones admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'abogado'
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<{ id: string; full_name: string; email: string; role: string } | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);

  // Cargar usuarios y roles al montar el componente
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crud/usuarios');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error de conexión al cargar usuarios');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.data);
      } else {
        setError(data.error || 'Error al cargar roles');
      }
    } catch (err) {
      setError('Error de conexión al cargar roles');
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-permissions?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUserPermissions(data.data);
      } else {
        setError(data.error || 'Error al cargar permisos del usuario');
      }
    } catch (err) {
      setError('Error de conexión al cargar permisos del usuario');
      console.error('Error fetching user permissions:', err);
    }
  };

  const handleViewPermissions = async (user: User) => {
    setSelectedUser(user);
    await fetchUserPermissions(user.id);
    setShowPermissionModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    try {
      const response = await fetch('/api/user-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRoleId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUserPermissions(selectedUser.id);
        setSelectedRoleId('');
      } else {
        setError(data.error || 'Error al asignar rol');
      }
    } catch (err) {
      setError('Error de conexión al asignar rol');
      console.error('Error assigning role:', err);
    }
  };

  const handleGrantPermission = async () => {
    if (!selectedUser || !newPermission.permissionKey) return;

    try {
      const response = await fetch('/api/user-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          permissionKey: newPermission.permissionKey,
          scope: newPermission.scope || null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewPermission({ permissionKey: '', scope: '' });
        await fetchUserPermissions(selectedUser.id);
      } else {
        setError(data.error || 'Error al otorgar permiso');
      }
    } catch (err) {
      setError('Error de conexión al otorgar permiso');
      console.error('Error granting permission:', err);
    }
  };

  const handleRevokePermission = async (permissionKey: string, roleId?: string) => {
    if (!selectedUser) return;

    try {
      const params = new URLSearchParams({
        userId: selectedUser.id,
        ...(permissionKey ? { permissionKey } : {}),
        ...(roleId ? { roleId } : {})
      });

      const response = await fetch(`/api/user-permissions?${params}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUserPermissions(selectedUser.id);
      } else {
        setError(data.error || 'Error al revocar permiso o rol');
      }
    } catch (err) {
      setError('Error de conexión al revocar permiso o rol');
      console.error('Error revoking permission/role:', err);
    }
  };

  // NUEVO: crear usuario (UI + llamada API)
  const validateNewUser = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) return 'Ingrese un email válido';
    const passRegex = /^\d{8,12}$/;
    if (!passRegex.test(newUser.password)) return 'La contraseña debe tener 8 a 12 dígitos numéricos';
    if (newUser.password !== newUser.confirm) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errMsg = validateNewUser();
    if (errMsg) { setError(errMsg); return; }
    setError(null);
    try {
      const res = await fetch('/api/crud/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          role: newUser.role,
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || data?.error || 'Error al crear usuario');
      setShowCreateModal(false);
      setNewUser({ full_name: '', email: '', password: '', confirm: '', role: 'abogado' });
      fetchUsers();
    } catch (e:any) {
      setError(e?.message || 'Error al crear usuario');
    }
  };

  // NUEVO: acciones admin por usuario
  const forceLogout = async (userId: string) => {
    try {
      setAdminActionLoading(userId + ':logout');
      const res = await fetch('/api/admin/users/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, disable: false })
      });
      await res.json().catch(()=>({}));
    } finally { setAdminActionLoading(null); }
  };

  const blockAndRevoke = async (userId: string) => {
    try {
      setAdminActionLoading(userId + ':block');
      const res = await fetch('/api/admin/users/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, disable: true })
      });
      await res.json().catch(()=>({}));
      fetchUsers();
    } finally { setAdminActionLoading(null); }
  };

  const enableUser = async (userId: string) => {
    try {
      setAdminActionLoading(userId + ':enable');
      const res = await fetch('/api/admin/users/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      await res.json().catch(()=>({}));
      fetchUsers();
    } finally { setAdminActionLoading(null); }
  };

  // NUEVO: editar usuario
  const openEditUser = (user: User) => {
    setEditUser({ id: user.id, full_name: user.full_name || '', email: user.email, role: user.role || 'abogado' });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const res = await fetch('/api/crud/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, email: editUser.email, full_name: editUser.full_name, role: editUser.role })
      });
      const data = await res.json().catch(()=>({success:false}));
      if (!res.ok || !data.success) throw new Error(data?.error || 'No se pudo actualizar el usuario');
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (e:any) {
      setError(e?.message || 'Error al actualizar usuario');
    }
  };

  // NUEVO: eliminar usuario
  const deleteUser = async (user: User) => {
    if (!confirm(`¿Eliminar al usuario ${user.full_name || user.email}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/crud/usuarios?id=${user.id}`, { method: 'DELETE' });
      const data = await res.json().catch(()=>({success:false}));
      if (!res.ok || !data.success) throw new Error(data?.error || 'No se pudo eliminar el usuario');
      fetchUsers();
    } catch (e:any) {
      setError(e?.message || 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administración de Usuarios</h1>
        <button onClick={()=> setShowCreateModal(true)} className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-lg">Crear Usuario</button>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Usuarios del Sistema</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_super_admin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.is_super_admin ? 'Super Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => handleViewPermissions(user)} className="text-blue-600 hover:text-blue-900">Permisos</button>
                    <button onClick={() => openEditUser(user)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => deleteUser(user)} className="text-red-600 hover:text-red-800">Eliminar</button>
                    <button onClick={() => forceLogout(user.id)} disabled={adminActionLoading===user.id+':logout'} className="text-gray-600 hover:text-gray-900 disabled:opacity-50">Forzar Logout</button>
                    <button onClick={() => blockAndRevoke(user.id)} disabled={adminActionLoading===user.id+':block'} className="text-red-700 hover:text-red-900 disabled:opacity-50">Bloquear+Revocar</button>
                    <button onClick={() => enableUser(user.id)} disabled={adminActionLoading===user.id+':enable'} className="text-green-700 hover:text-green-900 disabled:opacity-50">Habilitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">No se encontraron usuarios en el sistema.</p>
          </div>
        )}
      </div>

      {/* NUEVO: Modal crear usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
              <button onClick={()=> setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input value={newUser.full_name} onChange={e=> setNewUser({...newUser, full_name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={newUser.email} onChange={e=> setNewUser({...newUser, email: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (8–12 dígitos)</label>
                <input type="password" value={newUser.password} onChange={e=> setNewUser({...newUser, password: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input type="password" value={newUser.confirm} onChange={e=> setNewUser({...newUser, confirm: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={newUser.role} onChange={e=> setNewUser({...newUser, role: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="abogado">Abogado</option>
                  <option value="asistente">Asistente</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=> setShowCreateModal(false)} className="px-4 py-2 rounded border">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NUEVO: Modal editar usuario */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Usuario</h2>
              <button onClick={()=> setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input value={editUser.full_name} onChange={e=> setEditUser({...editUser, full_name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editUser.email} onChange={e=> setEditUser({...editUser, email: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={editUser.role} onChange={e=> setEditUser({...editUser, role: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="abogado">Abogado</option>
                  <option value="asistente">Asistente</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={()=> setShowEditModal(false)} className="px-4 py-2 rounded border">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestión de permisos */}
      {showPermissionModal && selectedUser && userPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Permisos de {selectedUser.full_name}</h2>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asignar Rol */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Asignar Rol</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles
                      .filter(role => !role.is_system_role)
                      .map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.display_name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAssignRole}
                    disabled={!selectedRoleId}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                  >
                    Asignar
                  </button>
                </div>
              </div>

              {/* Otorgar Permiso Individual */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Otorgar Permiso Individual</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPermission.permissionKey}
                    onChange={(e) => setNewPermission({...newPermission, permissionKey: e.target.value})}
                    placeholder="ej: casos:create"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newPermission.scope}
                    onChange={(e) => setNewPermission({...newPermission, scope: e.target.value})}
                    placeholder="Scope (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleGrantPermission}
                    disabled={!newPermission.permissionKey}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md w-full"
                  >
                    Otorgar Permiso
                  </button>
                </div>
              </div>
            </div>

            {/* NUEVO: Compartir recurso con este usuario */}
            <ShareResourceSection targetUserId={selectedUser.id} />

            {/* Roles Asignados */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Roles Asignados</h3>
              {userPermissions.roles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPermissions.roles.map((role) => (
                    <div key={role.role_id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-blue-900">{role.display_name}</h4>
                          <p className="text-sm text-blue-700">{role.description || 'Sin descripción'}</p>
                        </div>
                        <button
                          onClick={() => handleRevokePermission('', role.role_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No hay roles asignados</p>
              )}
            </div>

            {/* Permisos Individuales */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Permisos Individuales</h3>
              {userPermissions.directPermissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPermissions.directPermissions.map((permission) => (
                    <div key={permission.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-green-900">{permission.permission_key}</h4>
                          {permission.scope && (
                            <p className="text-sm text-green-700">Scope: {JSON.stringify(permission.scope)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRevokePermission(permission.permission_key)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No hay permisos individuales otorgados</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// NUEVO: subcomponente para compartir recursos con un usuario destino
function ShareResourceSection({ targetUserId }: { targetUserId: string }) {
  const [resourceType, setResourceType] = useState<'documento'|'expediente'|'cliente'>('documento');
  const [resourceId, setResourceId] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [access, setAccess] = useState<'read'|'write'>('read');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Búsqueda por nombre del recurso
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{id:string; name:string}>>([]);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      let url = '';
      if (resourceType === 'documento') url = `/api/search/documents?query=${encodeURIComponent(q)}`;
      if (resourceType === 'expediente') url = `/api/search/expedientes?query=${encodeURIComponent(q)}`;
      if (resourceType === 'cliente') url = `/api/search/clients?query=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data?.data || []);
    } catch {
      setResults([]);
    } finally { setLoading(false); }
  }

  function pick(r: {id:string; name:string}) {
    setResourceId(r.id);
    setResourceName(r.name);
    setQuery(r.name);
    setResults([]);
  }

  const onShare = async () => {
    if (!resourceId) { setMsg('Seleccione un recurso de la lista'); return; }
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType, resourceId, targetUserId, access })
      });
      const data = await res.json().catch(()=>({success:false}));
      if (!res.ok || !data.success) throw new Error(data?.error || 'No se pudo compartir');
      setMsg(`Compartido: ${resourceName}`);
      setResourceId('');
      setResourceName('');
      setQuery('');
    } catch (e:any) {
      setMsg(e?.message || 'Error al compartir');
    } finally { setSaving(false); }
  };

  return (
    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-2 text-yellow-900">Compartir recurso con este usuario</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select value={resourceType} onChange={e=> { setResourceType(e.target.value as any); setQuery(''); setResults([]); setResourceId(''); setResourceName(''); }} className="w-full border rounded px-3 py-2">
            <option value="documento">Documento</option>
            <option value="expediente">Expediente</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-medium mb-1">Buscar por nombre</label>
          <input value={query} onChange={e=> { setQuery(e.target.value); search(e.target.value); }} placeholder={`Escribe para buscar ${resourceType}...`} className="w-full border rounded px-3 py-2" />
          {loading && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
          {results.length>0 && (
            <ul className="absolute z-10 w-full bg-white border rounded mt-1 max-h-64 overflow-y-auto">
              {results.map(r => (
                <li key={r.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={()=> pick(r)}>{r.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Acceso</label>
          <select value={access} onChange={e=> setAccess(e.target.value as any)} className="w-full border rounded px-3 py-2">
            <option value="read">Solo lectura</option>
            <option value="write">Lectura y escritura</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onShare} disabled={saving} className="px-4 py-2 rounded bg-yellow-600 text-white disabled:opacity-50">Compartir</button>
      </div>
      {msg && <p className="mt-2 text-sm text-yellow-900">{msg}</p>}
    </div>
  );
}
