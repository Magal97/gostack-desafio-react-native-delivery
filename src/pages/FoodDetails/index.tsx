import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: number;
  thumbnail_url: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get('/foods', {
        params: {
          id_like: routeParams.id,
        },
      });

      const formatedFood = response.data.map((mapedFood: Food) => ({
        ...mapedFood,
        formattedPrice: formatValue(mapedFood.price),
      }));

      const checkExtras = formatedFood[0].extras;

      if (checkExtras) {
        const formatedExtras = checkExtras.map((extra: Extra) => ({
          ...extra,
          quantity: 0,
        }));
        setExtras(formatedExtras);
      }

      setFood(formatedFood[0]);
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function checkIsFavorite(): Promise<void> {
      const favorites = await api.get('/favorites');
      const checkFavorite = favorites.data.find(
        (favorite: Food) => favorite.id === food.id,
      );

      if (checkFavorite) {
        setIsFavorite(true);
      }
    }

    checkIsFavorite();
  }, [food.id]);

  function handleIncrementExtra(id: number): void {
    setExtras(
      extras.map(mapedExtra =>
        mapedExtra.id === id
          ? { ...mapedExtra, quantity: mapedExtra.quantity + 1 }
          : mapedExtra,
      ),
    );
  }

  function handleDecrementExtra(id: number): void {
    const findExtra = extras.find(extra => extra.id === id);

    if (!findExtra) return;
    if (findExtra.quantity === 0) return;

    setExtras(
      extras.map(mapedExtra =>
        mapedExtra.id === id
          ? { ...mapedExtra, quantity: mapedExtra.quantity - 1 }
          : mapedExtra,
      ),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity === 1) return;
    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`/favorites/${food.id}`);
    } else {
      api.post('/favorites', food);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extraTotal = extras.reduce((acummulator, extra) => {
      return acummulator + extra.quantity * extra.value;
    }, 0);

    const foodPrice = food.price;

    return formatValue((extraTotal + foodPrice) * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const selectedExtras = extras.filter(extra => extra.quantity > 0);
    const { id, name, description, price, thumbnail_url, category } = food;

    if (selectedExtras.length > 0) {
      const extrasItens = food.extras
        .map(extra => {
          const selected = selectedExtras.filter(
            filteredItem => filteredItem.id === extra.id,
          )[0];

          return {
            ...extra,
            quantity: selected?.quantity === undefined ? 0 : selected?.quantity,
          };
        })
        .filter(filtered => filtered.quantity !== 0);

      api.post('/orders', {
        id: Math.floor(Math.random() * (1000 - 1)) + 1,
        product_id: id,
        name,
        description,
        price,
        category,
        thumbnail_url,
        extras: extrasItens,
      });
    } else {
      api.post('/orders', {
        id: Math.floor(Math.random() * (1000 - 1)) + 1,
        product_id: id,
        name,
        description,
        price,
        category,
        thumbnail_url,
        extras: [],
      });
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
