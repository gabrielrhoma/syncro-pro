# Documentação da API de Edge Functions

Este documento descreve as Edge Functions de negócio que podem ser invocadas pelo frontend.

---

### `create-sale`

Cria uma nova venda, processa descontos, calcula comissões e orquestra a emissão fiscal.

- **Endpoint:** `POST /functions/v1/create-sale`
- **JSON Body:**
  ```json
  {
    "p_store_id": "uuid",
    "p_customer_id": "uuid | null",
    "p_payment_method": "string",
    "p_cart_items": [{ "product_id": "uuid", "quantity": "number", "unit_price": "number", "subtotal": "number" }],
    "p_coupon_code": "string | null",
    "p_loyalty_discount": "number", // Aplicado se pontos foram resgatados
    "p_contingency": "boolean" // true para não emitir NFC-e
  }
  ```
- **Resposta de Sucesso:**
  ```json
  { "sale_id": "uuid", "status": "success" }
  ```
- **Respostas de Erro:**
  ```json
  { "error": "Cupom expirado ou inválido." }
  { "error": "Não é possível usar um cupom e resgatar pontos na mesma compra." }
  ```
- **Exemplo (Fetch):**
  ```javascript
  const { data, error } = await supabase.functions.invoke('create-sale', {
    body: { /* ...payload */ }
  });
  ```

---

### `redeem-loyalty-points`

Resgata pontos de fidelidade de um cliente e retorna o valor do desconto.

- **Endpoint:** `POST /functions/v1/redeem-loyalty-points`
- **JSON Body:**
  ```json
  {
    "p_customer_id": "uuid",
    "p_points_to_redeem": "number",
    "p_store_id": "uuid"
  }
  ```
- **Resposta de Sucesso:**
  ```json
  { "success": true, "discount_amount": "number" }
  ```
- **Respostas de Erro:**
  ```json
  { "error": "Pontos de fidelidade insuficientes." }
  ```
