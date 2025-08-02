"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useContacts, useUsers } from "@/hooks/use-database";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { createUserAccount, getUserAccounts, sendPasswordEmail, generateRandomPassword, changePassword } from "@/lib/user-auth";
import { UserPlusIcon, KeyIcon, MailIcon } from "lucide-react";
import type { ContactFrontend as Contact } from "@/lib/database-schema";
import type { UserAccount, UserRole } from "@/lib/database-schema";

export default function AdminPage() {
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  const { data: contacts, loading: contactsLoading } = useContacts();
  const { data: userAccounts, loading: usersLoading, refresh: refreshUsers } = useUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("lawyer");
  const [email, setEmail] = useState("");
  const { toast } = useToast();


  if (contactsLoading || usersLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading admin panel...</div>;
  }

  // Only admin and developer can access this page
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateAccount = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email address is required."
      });
      return;
    }

    try {
      // TODO: Implement user account creation with database
      console.log('Creating account for:', email, selectedRole, selectedContactId);
      
      toast({
        variant: "destructive",
        title: "Not Implemented",
        description: "User account creation is not yet implemented with the database."
      });
      
      const { account, password } = await createUserAccount(email, selectedRole, selectedContactId || undefined);
      
      // Send email with password
      const emailSent = await sendPasswordEmail(email, password);
      
      refreshUsers();
      setIsDialogOpen(false);
      setEmail("");
      setSelectedContactId("");
      setSelectedRole("lawyer");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create account. Please try again."
      });
    }
  };

  const handleResendPassword = async (userAccount: UserAccount) => {
    // Generate new password and send email
    try {
      const newPassword = generateRandomPassword();
      const success = await changePassword(userAccount.id, newPassword);
      
      if (success) {
        const emailSent = await sendPasswordEmail(userAccount.email, newPassword);
        refreshUsers();
        
        toast({
          title: "Password Reset",
          description: `New password generated for ${userAccount.email}. ${emailSent ? 'Password sent via email.' : 'Email sending failed - please share password manually: ' + newPassword}`
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset password. Please try again."
      });
    }
  };

  const getContactName = (contactId?: string) => {
    if (!contactId || !contacts) return '';
    const contact = contacts.find(c => c.id === contactId);
    return contact?.name || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending_password_change':
        return <Badge variant="secondary">Pending</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'developer':
        return <Badge variant="default">Developer</Badge>;
      case 'lawyer':
        return <Badge variant="secondary">Lawyer</Badge>;
      case 'rental_company':
        return <Badge variant="outline">Rental Company</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and generate passwords for workspace access.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User Account</DialogTitle>
              <DialogDescription>
                Create a new workspace user account. A random password will be generated and emailed to the user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="rental_company">Rental Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Link to Contact (Optional)</Label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No contact</SelectItem>
                    {contacts && contacts
                      .filter(c => selectedRole === 'lawyer' ? c.type === 'Lawyer' : c.type === 'Rental Company')
                      .map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} ({contact.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleCreateAccount} className="w-full">
                Create Account & Send Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>Manage all user accounts in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userAccounts && userAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.email}</TableCell>
                  <TableCell>{getRoleBadge(account.role)}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>{getContactName(account.contact_id)}</TableCell>
                  <TableCell>{account.created_at ? new Date(account.created_at as any).toLocaleDateString() : ''}</TableCell>
                  <TableCell>
                    {account.last_login ? new Date(account.last_login as any).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendPassword(account)}
                      >
                        <KeyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}