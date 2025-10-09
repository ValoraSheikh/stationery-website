'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Switch 
} from "@/components/ui/switch";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  ToastContainer, toast 
} from 'react-toastify';
import { 
  ChevronDown, ChevronUp, Search, Edit, Trash, Eye, Star, AlertTriangle, ShoppingBag 
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: number;
  images: string[];
  name: string;
  brandName: string;
  mainCategory: string;
  subCategory: string;
  price: number;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// Mock data for products (in production, fetch from API)
const mockProducts: Product[] = [
  {
    id: 1,
    images: ['/placeholder-product1.jpg'],
    name: 'Premium Notebook A4',
    brandName: 'BrandX',
    mainCategory: 'A4',
    subCategory: 'Lined',
    price: 15.99,
    totalStock: 120,
    isActive: true,
    isFeatured: true,
    createdAt: '2023-01-15',
  },
  {
    id: 2,
    images: ['/placeholder-product2.jpg'],
    name: 'Executive Diary',
    brandName: 'BrandY',
    mainCategory: 'Diary',
    subCategory: 'Daily',
    price: 25.50,
    totalStock: 45,
    isActive: false,
    isFeatured: false,
    createdAt: '2023-02-20',
  },
  // Add more mock data as needed...
];

// Mock categories for filter
const categories: string[] = ['A4', 'A5', 'Diary'];

const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [featuredFilter, setFeaturedFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  // Quick metrics
  const totalProducts = products.length;
  const featuredProducts = products.filter(p => p.isFeatured).length;
  const lowStockItems = products.filter(p => p.totalStock < 50).length;

  // Filtered and sorted products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.mainCategory === categoryFilter;
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' ? product.isActive : !product.isActive);
    const matchesFeatured = featuredFilter === 'All' || 
      (featuredFilter === 'Featured' ? product.isFeatured : !product.isFeatured);
    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return sortOrder === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'totalStock') {
      return sortOrder === 'asc' ? a.totalStock - b.totalStock : b.totalStock - a.totalStock;
    } else if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Simulate fetching data
  useEffect(() => {
    setLoading(true);
    // In production: fetch from API
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleActive = (id: number) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success('Product status updated');
  };

  const toggleFeatured = (id: number) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, isFeatured: !p.isFeatured } : p
    ));
    toast.success('Featured status updated');
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    setIsDeleteConfirmOpen(false);
    toast.success('Product deleted');
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProduct) {
      setProducts(products.map(p => 
        p.id === selectedProduct.id ? { ...p, ...selectedProduct } : p
      ));
      setIsEditModalOpen(false);
      toast.success('Product updated');
    }
  };

  const updateEditField = (field: keyof Product, value: string | number | boolean) => {
    if (selectedProduct) {
      setSelectedProduct({ ...selectedProduct, [field]: value });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredProducts}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or brand..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Featured">Featured</SelectItem>
              <SelectItem value="Non-featured">Non-featured</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: string) => handleSort(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="totalStock">Stock</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('price')}
              >
                Price {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('totalStock')}
              >
                Stock {sortBy === 'totalStock' && (sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => handleSort('createdAt')}
              >
                Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">No products found</TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map(product => (
                <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <Image height={500} width={500} src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.brandName}</TableCell>
                  <TableCell>{product.mainCategory}</TableCell>
                  <TableCell>{product.subCategory}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.totalStock}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'success' : 'secondary'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={product.isFeatured} 
                      onCheckedChange={() => toggleFeatured(product.id)} 
                      className={product.isFeatured ? 'data-[state=checked]:bg-yellow-500' : ''}
                    />
                  </TableCell>
                  <TableCell>{product.createdAt}</TableCell>
                  <TableCell className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openViewModal(product)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsDeleteConfirmOpen(true); }}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Switch 
                      checked={product.isActive} 
                      onCheckedChange={() => toggleActive(product.id)} 
                      className="ml-2"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Stacked Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-4">No products found</div>
        ) : (
          paginatedProducts.map(product => (
            <Card key={product.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Image height={500} width={500} src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">${product.price.toFixed(2)} • {product.totalStock} in stock</p>
                    <Badge variant={product.isActive ? 'success' : 'secondary'} className="mt-1">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm">Featured:</span>
                      <Switch 
                        checked={product.isFeatured} 
                        onCheckedChange={() => toggleFeatured(product.id)} 
                        className={product.isFeatured ? 'data-[state=checked]:bg-yellow-500' : ''}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="ghost" size="icon" onClick={() => openViewModal(product)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsDeleteConfirmOpen(true); }}>
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Switch 
                      checked={product.isActive} 
                      onCheckedChange={() => toggleActive(product.id)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button 
          variant="outline" 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Previous
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button 
          variant="outline" 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </Button>
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <Image height={500} width={500} src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-64 object-cover rounded" />
              <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
              <p><strong>Brand:</strong> {selectedProduct.brandName}</p>
              <p><strong>Category:</strong> {selectedProduct.mainCategory} / {selectedProduct.subCategory}</p>
              <p><strong>Price:</strong> ${selectedProduct.price.toFixed(2)}</p>
              <p><strong>Stock:</strong> {selectedProduct.totalStock}</p>
              <p><strong>Status:</strong> {selectedProduct.isActive ? 'Active' : 'Inactive'}</p>
              <p><strong>Featured:</strong> {selectedProduct.isFeatured ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {selectedProduct.createdAt}</p>
              {/* Add more details like description, variants, specs */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input 
                  id="name"
                  value={selectedProduct.name} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEditField('name', e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="brandName" className="text-sm font-medium">Brand</label>
                <Input 
                  id="brandName"
                  value={selectedProduct.brandName} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEditField('brandName', e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="mainCategory" className="text-sm font-medium">Category</label>
                <Select 
                  value={selectedProduct.mainCategory} 
                  onValueChange={(value: string) => updateEditField('mainCategory', value)}
                >
                  <SelectTrigger id="mainCategory">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="subCategory" className="text-sm font-medium">Sub Category</label>
                <Input 
                  id="subCategory"
                  value={selectedProduct.subCategory} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEditField('subCategory', e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="price" className="text-sm font-medium">Price</label>
                <Input 
                  id="price"
                  type="number" 
                  value={selectedProduct.price} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEditField('price', parseFloat(e.target.value))} 
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="totalStock" className="text-sm font-medium">Stock</label>
                <Input 
                  id="totalStock"
                  type="number" 
                  value={selectedProduct.totalStock} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEditField('totalStock', parseInt(e.target.value, 10))} 
                />
              </div>
              {/* Add more fields for description, variants, images, etc. */}
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedProduct && handleDelete(selectedProduct.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagementPage;