import Product from '../models/Product';
import Database from './Database'
import CrudAsync from '../models/CrudAsync';

class ProductService implements CrudAsync<Product> {
  createAsync(product: Product): Promise<void> {
    return new Promise((resolve: Function, reject: Function) => {
      Database.query(
        `insert into product (name, code, description, price, quantity)
         values (?, ?, ?, 0, 0)`, [
        product.name,
        product.code,
        product.description,
      ])
        .on('error', err => reject(err))
        .on('end', () => resolve())
    });
  }

  getByIdAsync(id: number): Promise<Product> {
    return new Promise((resolve, reject) => {
      const sql = `
        select p.*, IFNULL(sum(s.quantity_available), 0) as quantity_available
        from product p
        inner join sku s on s.product_id = p.id
        where p.id = ?;`;

      Database.query(sql, id, (err, results) => {
        if (!err) {
          const [first] = results;
          const product = mapRowToProduct(first);
          resolve(product);
        } else {
          reject(err);
        }
      });
    });
  }

  getPageAsync(page: number): Promise<Product[]> {
    throw new Error('Method not implemented.');
  }

  getAllAsync(): Promise<Product[]> {
    return new Promise((resolve: Function, reject: Function) => {
      const sql = `
        SELECT product.*, IFNULL(sum(sku.quantity_available), 0) as quantity_available
        from product
        left join sku on sku.product_id = product.id
        where product.active = 1
        and sku.active = 1
        group by sku.product_id
        order by product.id;`;

      Database.query(sql, (err: Error, results: any[]) => {
        if (!err) {
          const products = results.map(mapRowToProduct);
          resolve(products)
        } else {
          reject(err);
        }
      });
    });
  }

  searchAsync(query: string): Promise<Product[]> {
    return new Promise((resolve: Function, reject: Function) => {
      const escaped = Database.escape('%' + query + '%');
      const sql = `
        select p.*, ifnull(sum(s.quantity_available), 0) as quantity_available
        from product p
        left join sku s on s.product_id = p.id
        where p.name like ${escaped}
        and p.active = 1
        and s.active = 1
        group by p.id
        order by p.id;`

      Database.query(sql, query, (err: Error | null, results: any[]) => {
        if (!err) {
          const products = results.map(mapRowToProduct);
          resolve(products);
        } else {
          reject(err);
        }
      });
    });
  }

  updateAsync(update: Product): Promise<void> {
    throw new Error('Method not implemented.');
  }

  removeAsync(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      Database.query('update product set active = 0 where id = ?', id)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
  }
}

function mapRowToProduct(row: any): Product {
  return {
    id: row['id'] || 0,
    code: row['code'] || '',
    dateCreated: row['date_created'],
    expirationDate: row['date_expires'],
    description: row['description'] || '',
    name: row['name'] || '',
    price: row['price'] || 0,
    quantityAvailable: row['quantity_available'] || 0
  }
}

export default ProductService;
