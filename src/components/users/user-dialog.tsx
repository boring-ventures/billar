"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { User, UserRoleType } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUsers } from "@/hooks/use-users";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  role: z.enum(["SELLER", "ADMIN", "SUPERADMIN"] as const),
  companyId: z.string().optional(),
  active: z.boolean().default(true),
});

// Special value to represent no company selected
const NO_COMPANY = "none";

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  isSubmitting = false,
}: UserDialogProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const { createUser, updateUser } = useUsers();
  const [loading, setLoading] = useState(false);

  const isEditing = !!user;

  // Get the user's role as a valid UserRoleType
  const getUserRole = (role: string | undefined): UserRoleType => {
    if (role === "SELLER" || role === "ADMIN" || role === "SUPERADMIN") {
      return role;
    }
    return "SELLER"; // Default role
  };

  // Helper to convert between form value and actual companyId
  const getCompanyIdValue = (id: string | null | undefined): string => {
    return id || NO_COMPANY;
  };

  const getActualCompanyId = (value: string): string | null => {
    return value === NO_COMPANY ? null : value;
  };

  // Define default values based on whether we're editing or creating
  const defaultValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: "",
    password: "",
    role: getUserRole(user?.role as string),
    companyId: getCompanyIdValue(user?.companyId),
    active: user?.active !== undefined ? user.active : true,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies");
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  // Reset form when user changes
  useEffect(() => {
    if (open) {
      // Different form schemas for create vs edit
      if (isEditing && user) {
        form.reset({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          role: getUserRole(user?.role as string),
          companyId: getCompanyIdValue(user?.companyId),
          active: user?.active !== undefined ? user.active : true,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "SELLER",
          companyId: NO_COMPANY,
          active: true,
        });
      }
    }
  }, [open, user, form, isEditing]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      let success;

      if (isEditing && user) {
        // Update existing user
        success = await updateUser(user.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          active: values.active,
        });
      } else {
        // Create new user
        if (!values.email || !values.password) {
          toast({
            title: "Error",
            description: "Email and password are required for new users",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        success = await createUser({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          companyId: getActualCompanyId(values.companyId || NO_COMPANY),
          active: values.active,
        });
      }

      if (success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit User" : "Create New User"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the user details below."
              : "Fill in the details to create a new user."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && user?.email && (
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Email cannot be changed after creation.
                </p>
              </div>
            )}

            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="johndoe@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Email cannot be changed after creation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SELLER">Seller</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value || NO_COMPANY}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_COMPANY}>None</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditing && user?.companyId && (
              <div className="space-y-2">
                <FormLabel>Company</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  {user.company?.name || "Assigned Company"}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Company assignment cannot be changed after creation.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Inactive users cannot login to the system.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading || isSubmitting}>
                {loading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update User"
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
